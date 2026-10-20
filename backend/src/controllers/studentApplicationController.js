'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { sequelize, MembershipApplication, MembershipStatusHistory, StudentProfile, AuditLog } = require('../models');
const { generateApplicationNumber } = require('../utils/applicationNumber');

const STORAGE_DIR = path.resolve(process.env.STUDENT_DOCUMENT_STORAGE_PATH || path.join(__dirname, '../../private/student-documents'));
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9().\s-]{7,30}$/;
const FIELD_LIMITS = {
  first_name: 100, last_name: 100, email: 255, mobile_number: 30,
  invoicing_address: 10000, nationality: 100, institution_name: 255,
  degree_type: 150, field_of_study: 255,
};

const sniffDocument = (buffer) => {
  if (buffer.subarray(0, 5).toString('ascii') === '%PDF-') return { mime: 'application/pdf', extension: 'pdf' };
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { mime: 'image/jpeg', extension: 'jpg' };
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { mime: 'image/png', extension: 'png' };
  return null;
};

const validDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value && date <= new Date(new Date().toISOString().slice(0, 10));
};

const validate = (body, document) => {
  const errors = {};
  const acceptedFields = new Set([
    'first_name', 'last_name', 'email', 'mobile_number', 'invoicing_address', 'nationality', 'date_of_birth',
    'institution_name', 'degree_type', 'field_of_study', 'enrollment_type', 'graduation_month', 'graduation_year',
  ]);
  for (const field of Object.keys(body || {})) if (!acceptedFields.has(field)) errors[field] = 'This field is not supported.';
  for (const [field, max] of Object.entries(FIELD_LIMITS)) {
    const value = body?.[field];
    if (typeof value !== 'string' || !value.trim()) errors[field] = 'This field is required.';
    else if (value.trim().length > max) errors[field] = `Enter no more than ${max} characters.`;
  }
  if (typeof body?.email === 'string' && !EMAIL_REGEX.test(body.email.trim())) errors.email = 'Enter a valid email address.';
  if (typeof body?.mobile_number === 'string' && !PHONE_REGEX.test(body.mobile_number.trim())) errors.mobile_number = 'Enter a valid mobile number with country code, using digits and common phone punctuation.';
  if (typeof body?.mobile_number === 'string' && (body.mobile_number.match(/\d/g) || []).length < 7) errors.mobile_number = 'Enter a mobile number with at least 7 digits.';
  if (!validDate(body?.date_of_birth)) errors.date_of_birth = 'Enter a valid date of birth that is not in the future.';
  if (!['FULL_TIME', 'PART_TIME'].includes(body?.enrollment_type)) errors.enrollment_type = 'Choose full-time or part-time enrollment.';
  const month = Number(body?.graduation_month);
  if (!Number.isInteger(month) || month < 1 || month > 12) errors.graduation_month = 'Choose a valid graduation month.';
  const year = Number(body?.graduation_year);
  const currentYear = new Date().getUTCFullYear();
  if (!Number.isInteger(year) || year < currentYear || year > 9999 || (year === currentYear && month < new Date().getUTCMonth() + 1)) {
    errors.graduation_year = 'Enter a valid expected graduation year.';
  }
  if (!document?.buffer) errors.proof_of_enrollment = 'Upload a proof of enrollment document.';
  else {
    const sniffed = sniffDocument(document.buffer);
    if (!sniffed) errors.proof_of_enrollment = 'Upload a PDF, JPEG, or PNG document.';
    else if (document.claimedType && document.claimedType !== sniffed.mime && !(sniffed.mime === 'image/jpeg' && document.claimedType === 'image/pjpeg')) {
      errors.proof_of_enrollment = 'The selected document content does not match its file type.';
    }
    else if (!document.buffer.length || document.buffer.length > 5 * 1024 * 1024) errors.proof_of_enrollment = 'The supporting document must be 5 MB or smaller.';
  }
  return errors;
};

const submitStudentApplication = async (req, res, next) => {
  let transaction;
  let storedPath;
  try {
    const errors = validate(req.body, req.studentDocument);
    if (Object.keys(errors).length) return res.status(400).json({ success: false, message: 'Check the highlighted application fields.', errors });

    const data = Object.fromEntries(Object.entries(req.body).map(([key, value]) => [key, value.trim()]));
    data.email = data.email.toLowerCase();
    if (data.email !== String(req.user?.email || '').toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Sign in with the email address used for this student application.' });
    }
    const duplicateProfile = await StudentProfile.findOne({ where: { email: data.email } });
    if (duplicateProfile) return res.status(409).json({ success: false, message: 'An application already exists for this email address.' });

    const documentType = sniffDocument(req.studentDocument.buffer);
    const storageKey = `${randomUUID()}.${documentType.extension}`;
    await fs.mkdir(STORAGE_DIR, { recursive: true, mode: 0o700 });
    storedPath = path.join(STORAGE_DIR, storageKey);
    await fs.writeFile(storedPath, req.studentDocument.buffer, { flag: 'wx', mode: 0o600 });

    transaction = await sequelize.transaction();
    const application = await MembershipApplication.create({
      application_number: await generateApplicationNumber(),
      user_id: req.user.id,
      membership_type: 'STUDENT',
      status: 'PENDING',
      submitted_at: new Date(),
    }, { transaction });

    const student = await StudentProfile.create({
      application_id: application.id,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      mobile_number: data.mobile_number,
      invoicing_address: data.invoicing_address,
      nationality: data.nationality,
      date_of_birth: data.date_of_birth,
      institution_name: data.institution_name,
      degree_type: data.degree_type,
      field_of_study: data.field_of_study,
      enrollment_type: data.enrollment_type,
      graduation_month: Number(data.graduation_month),
      graduation_year: Number(data.graduation_year),
      document_storage_key: storageKey,
      document_original_name: req.studentDocument.originalName.slice(0, 255),
      document_mime_type: documentType.mime,
      document_size: req.studentDocument.buffer.length,
    }, { transaction });

    await MembershipStatusHistory.create({
      application_id: application.id,
      old_status: null,
      new_status: 'PENDING',
      changed_by: null,
      reason: 'Student membership application submitted.',
    }, { transaction });
    await AuditLog.create({
      user_id: req.user.id,
      action: 'SUBMIT_STUDENT_APPLICATION',
      module: 'MEMBERSHIP',
      entity_type: 'MembershipApplication',
      entity_id: String(application.id),
      new_values: { application_number: application.application_number, membership_type: 'STUDENT', status: 'PENDING' },
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    }, { transaction });
    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: 'Student membership application submitted successfully.',
      data: { id: application.id, application_number: application.application_number, membership_type: 'STUDENT', status: 'PENDING', submitted_at: application.submitted_at, applicant_name: `${student.first_name} ${student.last_name}` },
    });
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    if (storedPath) await fs.unlink(storedPath).catch(() => {});
    if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ success: false, message: 'An application already exists for this email address.' });
    next(error);
  }
};

// GET /membership/applications/student is used by the registration page to
// check whether the signed-in member already has a student application. A new
// applicant receives a successful empty result so opening the form is not
// treated as a missing API resource.
const getMyStudentApplication = async (req, res, next) => {
  try {
    const application = await MembershipApplication.findOne({
      where: { user_id: req.user.id, membership_type: 'STUDENT' },
      order: [['created_at', 'DESC']],
      include: [{ model: StudentProfile, as: 'studentProfile', attributes: { exclude: ['document_storage_key'] } }],
      attributes: [
        'id', 'application_number', 'membership_type', 'status', 'submitted_at',
        'reviewed_at', 'approved_at', 'rejected_at', 'review_remarks', 'created_at',
      ],
    });

    return res.json({ success: true, data: { application } });
  } catch (error) {
    next(error);
  }
};

const downloadStudentDocument = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ where: { application_id: req.params.id } });
    if (!profile) return res.status(404).json({ success: false, message: 'Student application document not found.' });
    const filePath = path.join(STORAGE_DIR, path.basename(profile.document_storage_key));
    await fs.access(filePath);
    await AuditLog.create({
      user_id: req.user.id,
      action: 'STUDENT_DOCUMENT_ACCESS_GRANTED',
      module: 'MEMBERSHIP',
      entity_type: 'MembershipApplication',
      entity_id: String(profile.application_id),
      ip_address: req.ip,
      user_agent: String(req.get('user-agent') || '').slice(0, 500),
    });
    res.set({
      'Content-Type': profile.document_mime_type,
      'Content-Disposition': `attachment; filename="${profile.document_original_name.replace(/["\\\r\n]/g, '_')}"`,
      'Content-Length': profile.document_size,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    });
    return res.sendFile(filePath, (error) => { if (error && !res.headersSent) next(error); });
  } catch (error) {
    if (error.code === 'ENOENT') return res.status(404).json({ success: false, message: 'Student application document is unavailable.' });
    next(error);
  }
};

module.exports = { submitStudentApplication, getMyStudentApplication, downloadStudentDocument };
