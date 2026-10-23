'use strict';

const {
  sequelize,
  MembershipApplication,
  IndividualProfile,
  CorporateProfile,
  CorporateRepresentative,
  User,
  MembershipStatusHistory,
  AuditLog,
  StudentProfile,
  Payment,
  Invoice,
} = require('../models');
const { generateApplicationNumber } = require('../utils/applicationNumber');
const { calculateMembershipFee } = require('../services/feeCalculationService');
const { calculateMembershipPeriod } = require('../services/membershipActivationService');
const { generatePaymentReference, generateInvoiceNumber } = require('../utils/referenceGenerator');
const { Op } = require('sequelize');
const industryCategories = require('../../../shared/industry-classification.json');
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateApplicationBody = (body) => {
  const allowedFields = new Set([
    'membership_type', 'company', 'designation', 'biography', 'linkedin_url', 'photo_url',
    'nationality', 'date_of_birth', 'invoicing_address', 'phone', 'company_name',
    'company_description', 'invoicing_contact_person', 'invoicing_email', 'contact_phone',
    'main_contacts', 'additional_contacts', 'representatives', 'industry_main_category', 'industry_sub_category',
  ]);
  const errors = {};
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: { body: 'Application details must be an object.' } };
  }

  for (const field of Object.keys(body)) {
    if (!allowedFields.has(field)) errors[field] = 'This field is not supported.';
  }
  if (!['INDIVIDUAL', 'CORPORATE'].includes(body.membership_type)) {
    errors.membership_type = 'Choose INDIVIDUAL or CORPORATE membership.';
  }

  const requiredByType = body.membership_type === 'INDIVIDUAL'
    ? ['company', 'designation', 'biography', 'invoicing_address', 'phone']
    : body.membership_type === 'CORPORATE'
      ? ['company_name', 'company_description', 'invoicing_address', 'invoicing_contact_person', 'invoicing_email', 'main_contacts', 'additional_contacts']
      : [];
  for (const field of requiredByType) {
    if (typeof body[field] !== 'string' || !body[field].trim()) errors[field] = 'This field is required.';
  }
  if (body.membership_type === 'CORPORATE') {
    const subCategories = industryCategories[body.industry_main_category];
    if (!subCategories) errors.industry_main_category = 'Choose a valid main industry category.';
    if (!Array.isArray(subCategories) || !subCategories.includes(body.industry_sub_category)) {
      errors.industry_sub_category = 'Choose a sub-category belonging to the selected main category.';
    }
  } else if (body.industry_main_category !== undefined || body.industry_sub_category !== undefined) {
    errors.industry_main_category = 'Industry classification is only supported for corporate applications.';
  }

  const maxLengths = {
    company: 255, designation: 255, linkedin_url: 500, photo_url: 500, nationality: 100,
    phone: 20, company_name: 255, invoicing_contact_person: 255, invoicing_email: 255,
    contact_phone: 50,
  };
  for (const [field, max] of Object.entries(maxLengths)) {
    if (body[field] !== undefined && body[field] !== null && body[field] !== '' &&
        (typeof body[field] !== 'string' || body[field].trim().length > max)) {
      errors[field] = `This field must be text of at most ${max} characters.`;
    }
  }
  for (const field of ['biography', 'invoicing_address', 'company_description', 'main_contacts', 'additional_contacts']) {
    if (body[field] !== undefined && body[field] !== null && body[field] !== '' &&
        (typeof body[field] !== 'string' || body[field].length > 10000)) {
      errors[field] = 'This field must be text of at most 10000 characters.';
    }
  }
  if (body.invoicing_email !== undefined &&
      (typeof body.invoicing_email !== 'string' || !EMAIL_REGEX.test(body.invoicing_email.trim()))) {
    errors.invoicing_email = 'Enter a valid invoicing email address.';
  }
  if (body.date_of_birth !== undefined && body.date_of_birth !== null && body.date_of_birth !== '') {
    const value = body.date_of_birth;
    const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00.000Z`) : null;
    if (!date || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      errors.date_of_birth = 'Enter a valid date of birth.';
    }
  }
  if (body.representatives !== undefined) {
    if (body.membership_type !== 'CORPORATE' || !Array.isArray(body.representatives)) {
      errors.representatives = 'Representatives must be a list for a corporate application.';
    } else {
      body.representatives.forEach((representative, index) => {
        if (!representative || typeof representative !== 'object' || Array.isArray(representative) ||
            typeof representative.name !== 'string' || !representative.name.trim() || representative.name.trim().length > 255) {
          errors.representatives = `Representative ${index + 1} must have a name of at most 255 characters.`;
        }
        for (const field of ['email', 'phone', 'designation']) {
          const max = field === 'email' || field === 'designation' ? 255 : 50;
          if (representative?.[field] !== undefined && representative[field] !== null && representative[field] !== '' &&
              (typeof representative[field] !== 'string' || representative[field].trim().length > max)) {
            errors.representatives = `Representative ${index + 1} has an invalid ${field}.`;
          }
        }
        if (typeof representative?.email === 'string' && representative.email && !EMAIL_REGEX.test(representative.email.trim())) {
          errors.representatives = `Representative ${index + 1} has an invalid email.`;
        }
        if (representative?.is_primary !== undefined && typeof representative.is_primary !== 'boolean') {
          errors.representatives = `Representative ${index + 1} has an invalid primary flag.`;
        }
      });
    }
  }

  if (Object.keys(errors).length) return { errors };
  const normalizedData = { ...body };
  for (const [field, value] of Object.entries(normalizedData)) {
    if (typeof value === 'string') normalizedData[field] = value.trim();
  }
  return { data: normalizedData };
};

/**
 * Allowed status transitions for Membership Applications.
 */
const ALLOWED_TRANSITIONS = {
  PENDING: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['PAYMENT_PENDING', 'CLARIFICATION_REQUIRED', 'REJECTED'],
  // A clarification request must be answered by the applicant before an admin
  // can review the application again. Resubmission moves it back to PENDING.
  CLARIFICATION_REQUIRED: ['PENDING'],
  PAYMENT_PENDING: [], // Locked until payment processing in later step
  REJECTED: [], // Terminal state
  APPROVED: [], // Terminal / Locked
};

const isAllowedTransition = (currentStatus, targetStatus) => {
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  return Array.isArray(allowed) && allowed.includes(targetStatus);
};

const parseReviewRemarks = (body, required = false) => {
  const value = body?.review_remarks;
  if (value === undefined || value === null) {
    return required ? { error: 'Review remarks are required.' } : { value: '' };
  }
  if (typeof value !== 'string' || value.trim().length > 4000) {
    return { error: 'Review remarks must be text of at most 4000 characters.' };
  }
  const trimmed = value.trim();
  if (required && !trimmed) return { error: 'Review remarks are required.' };
  return { value: trimmed };
};

const parseClarificationResponse = (value) => {
  if (typeof value !== 'string' || !value.trim()) return { error: 'Explain how you addressed the requested clarification.' };
  if (value.trim().length > 4000) return { error: 'Your clarification response must be 4000 characters or fewer.' };
  return { value: value.trim() };
};


/**
 * Submit a new Individual or Corporate Membership Application.
 */
const submitApplication = async (req, res, next) => {
  let transaction;
  try {
    const validation = validateApplicationBody(req.body);
    if (validation.errors) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: validation.errors });
    }
    const applicationData = validation.data;
    transaction = await sequelize.transaction();
    const userId = req.user.id;
    const {
      membership_type,
      // Individual fields
      company,
      designation,
      biography,
      linkedin_url,
      photo_url,
      nationality,
      date_of_birth,
      invoicing_address,
      phone,
      // Corporate fields
      company_name,
      company_description,
      invoicing_contact_person,
      invoicing_email,
      contact_phone,
      main_contacts,
      additional_contacts,
      representatives,
      industry_main_category,
      industry_sub_category,
    } = applicationData;

    const applicant = await User.findByPk(userId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!applicant) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Applicant account was not found.' });
    }

    // Duplicate active application protection
    const activeApp = await MembershipApplication.findOne({
      where: {
        user_id: userId,
        status: {
          [Op.in]: [
            'DRAFT',
            'PENDING',
            'UNDER_REVIEW',
            'CLARIFICATION_REQUIRED',
            'APPROVED',
            'PAYMENT_PENDING',
          ],
        },
      },
      transaction,
    });

    if (activeApp) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: `You already have a membership application in progress (${activeApp.application_number}). Current status: ${activeApp.status}.`,
        data: {
          application_number: activeApp.application_number,
          status: activeApp.status,
        },
      });
    }

    // Generate unique application number
    const applicationNumber = await generateApplicationNumber();

    // Create Membership Application record
    const application = await MembershipApplication.create(
      {
        application_number: applicationNumber,
        user_id: userId,
        membership_type,
        status: 'PENDING',
        submitted_at: new Date(),
      },
      { transaction }
    );

    // Save type-specific profile data
    if (membership_type === 'INDIVIDUAL') {
      applicant.phone = phone;
      await applicant.save({ transaction });
      await IndividualProfile.upsert(
        {
          user_id: userId,
          company: company || null,
          designation: designation || null,
          biography: biography || null,
          linkedin_url: linkedin_url || null,
          photo_url: photo_url || null,
          nationality: nationality || null,
          date_of_birth: date_of_birth || null,
          invoicing_address: invoicing_address || null,
        },
        { transaction }
      );
    } else if (membership_type === 'CORPORATE') {
      const [corporateProfile] = await CorporateProfile.upsert(
        {
          user_id: userId,
          company_name: company_name || `${req.user.first_name}'s Company`,
          company_description: company_description || null,
          industry_main_category,
          industry_sub_category,
          address: invoicing_address || null,
          invoicing_contact_person: invoicing_contact_person || null,
          contact_email: invoicing_email || req.user.email,
          contact_phone: contact_phone || req.user.phone,
          main_contacts: main_contacts || null,
          additional_contacts: additional_contacts || null,
        },
        { transaction, returning: true }
      );

      // Handle representatives if provided
      if (Array.isArray(representatives) && representatives.length > 0) {
        const corpProfId = corporateProfile.id || (await CorporateProfile.findOne({ where: { user_id: userId }, transaction })).id;
        const repRecords = representatives.map((rep) => ({
          corporate_profile_id: corpProfId,
          name: rep.name,
          email: rep.email || null,
          phone: rep.phone || null,
          designation: rep.designation || null,
          is_primary: Boolean(rep.is_primary),
          status: 'ACTIVE',
        }));

        await CorporateRepresentative.bulkCreate(repRecords, { transaction });
      }
    }

    // Record initial status history
    await MembershipStatusHistory.create(
      {
        application_id: application.id,
        old_status: null,
        new_status: 'PENDING',
        changed_by: userId,
        reason: 'Application submitted by user',
      },
      { transaction }
    );

    // Record audit log
    await AuditLog.create(
      {
        user_id: userId,
        action: 'SUBMIT_APPLICATION',
        module: 'MEMBERSHIP',
        entity_type: 'MembershipApplication',
        entity_id: String(application.id),
        new_values: {
          application_number: applicationNumber,
          membership_type,
          status: 'PENDING',
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: 'Membership application submitted successfully.',
      data: {
        id: application.id,
        application_number: application.application_number,
        membership_type: application.membership_type,
        status: application.status,
        submitted_at: application.submitted_at,
      },
    });
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    next(error);
  }
};

/**
 * Get current authenticated user's applications.
 */
const getMyApplications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const applications = await MembershipApplication.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      include: [
        { model: StudentProfile, as: 'studentProfile', attributes: { exclude: ['document_storage_key'] } },
        { model: User, as: 'applicant', attributes: ['id', 'email', 'first_name', 'last_name', 'phone'] },
      ],
      attributes: [
        'id',
        'application_number',
        'membership_type',
        'status',
        'submitted_at',
        'reviewed_at',
        'approved_at',
        'rejected_at',
        'review_remarks',
        'created_at',
      ],
    });

    const individualProfile = await IndividualProfile.findOne({ where: { user_id: userId } });
    const corporateProfile = await CorporateProfile.findOne({
      where: { user_id: userId },
      include: [{ model: CorporateRepresentative, as: 'representatives' }],
    });

    return res.json({
      success: true,
      data: {
        applications,
        profiles: {
          individual: individualProfile,
          corporate: corporateProfile,
          student: applications.find(({ studentProfile }) => studentProfile)?.studentProfile || null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's specific application details by ID.
 */
const getMyApplicationById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const application = await MembershipApplication.findOne({
      where: { id, user_id: userId },
      include: [
        { model: StudentProfile, as: 'studentProfile', attributes: { exclude: ['document_storage_key'] } },
        { model: User, as: 'applicant', attributes: ['id', 'email', 'first_name', 'last_name', 'phone'] },
      ],
      attributes: [
        'id',
        'application_number',
        'membership_type',
        'status',
        'submitted_at',
        'reviewed_at',
        'approved_at',
        'rejected_at',
        'review_remarks',
        'created_at',
      ],
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or unauthorized access.',
      });
    }

    const profiles = {
      individual: await IndividualProfile.findOne({ where: { user_id: userId } }),
      corporate: await CorporateProfile.findOne({
        where: { user_id: userId },
        include: [{ model: CorporateRepresentative, as: 'representatives' }],
      }),
    };

    return res.json({
      success: true,
      data: { ...application.toJSON(), profiles },
    });
  } catch (error) {
    next(error);
  }
};

/** Member resubmission after an administrator requests clarification. */
const resubmitApplicationClarification = async (req, res, next) => {
  let transaction;
  try {
    const response = parseClarificationResponse(req.body?.clarification_response);
    if (response.error) return res.status(400).json({ success: false, message: response.error, errors: { clarification_response: response.error } });

    const { clarification_response, ...applicationBody } = req.body || {};
    const validation = validateApplicationBody(applicationBody);
    if (validation.errors) return res.status(400).json({ success: false, message: 'Check the highlighted application fields.', errors: validation.errors });
    const data = validation.data;

    transaction = await sequelize.transaction();
    const application = await MembershipApplication.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!application) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }
    if (application.status !== 'CLARIFICATION_REQUIRED') {
      await transaction.rollback();
      return res.status(409).json({ success: false, message: 'This application is not waiting for clarification.' });
    }
    if (data.membership_type !== application.membership_type || data.membership_type === 'STUDENT') {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'The application type cannot be changed.' });
    }

    const applicant = await User.findByPk(req.user.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!applicant) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Applicant account was not found.' });
    }

    if (data.membership_type === 'INDIVIDUAL') {
      applicant.phone = data.phone;
      await applicant.save({ transaction });
      await IndividualProfile.upsert({
        user_id: req.user.id,
        company: data.company || null,
        designation: data.designation || null,
        biography: data.biography || null,
        linkedin_url: data.linkedin_url || null,
        photo_url: data.photo_url || null,
        nationality: data.nationality || null,
        date_of_birth: data.date_of_birth || null,
        invoicing_address: data.invoicing_address || null,
      }, { transaction });
    } else {
      let corporateProfile = await CorporateProfile.findOne({ where: { user_id: req.user.id }, transaction, lock: transaction.LOCK.UPDATE });
      const corporateData = {
        user_id: req.user.id,
        company_name: data.company_name,
        company_description: data.company_description,
        industry_main_category: data.industry_main_category,
        industry_sub_category: data.industry_sub_category,
        address: data.invoicing_address,
        invoicing_contact_person: data.invoicing_contact_person,
        contact_email: data.invoicing_email,
        contact_phone: data.contact_phone || applicant.phone,
        main_contacts: data.main_contacts,
        additional_contacts: data.additional_contacts,
      };
      if (corporateProfile) await corporateProfile.update(corporateData, { transaction });
      else corporateProfile = await CorporateProfile.create(corporateData, { transaction });

      await CorporateRepresentative.destroy({ where: { corporate_profile_id: corporateProfile.id }, transaction });
      if (Array.isArray(data.representatives) && data.representatives.length) {
        await CorporateRepresentative.bulkCreate(data.representatives.map((representative) => ({
          corporate_profile_id: corporateProfile.id,
          name: representative.name.trim(),
          email: representative.email?.trim() || null,
          phone: representative.phone?.trim() || null,
          designation: representative.designation?.trim() || null,
          is_primary: Boolean(representative.is_primary),
          status: 'ACTIVE',
        })), { transaction });
      }
    }

    application.status = 'PENDING';
    application.submitted_at = new Date();
    application.reviewed_at = null;
    application.reviewed_by = null;
    await application.save({ transaction });
    await MembershipStatusHistory.create({
      application_id: application.id,
      old_status: 'CLARIFICATION_REQUIRED',
      new_status: 'PENDING',
      changed_by: req.user.id,
      reason: `Applicant clarification response: ${response.value}`,
    }, { transaction });
    await AuditLog.create({
      user_id: req.user.id,
      action: 'APPLICATION_CLARIFICATION_RESUBMITTED',
      module: 'MEMBERSHIP',
      entity_type: 'MembershipApplication',
      entity_id: String(application.id),
      old_values: { status: 'CLARIFICATION_REQUIRED' },
      new_values: { status: 'PENDING', clarification_response: response.value },
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    }, { transaction });
    await transaction.commit();
    return res.json({ success: true, message: 'Your updated application has been resubmitted for review.', data: { id: application.id, status: application.status } });
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    next(error);
  }
};

/**
 * Administrative: List all applications with filtering, search, and pagination.
 */
const getAdminApplications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const { status, membership_type, search } = req.query;

    const where = {};
    if (status) where.status = status;
    if (membership_type) where.membership_type = membership_type;

    if (search) {
      where[Op.or] = [
        { application_number: { [Op.like]: `%${search}%` } },
        { '$applicant.email$': { [Op.like]: `%${search}%` } },
        { '$applicant.first_name$': { [Op.like]: `%${search}%` } },
        { '$applicant.last_name$': { [Op.like]: `%${search}%` } },
        { '$studentProfile.email$': { [Op.like]: `%${search}%` } },
        { '$studentProfile.first_name$': { [Op.like]: `%${search}%` } },
        { '$studentProfile.last_name$': { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: applications } = await MembershipApplication.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'applicant',
          attributes: ['id', 'email', 'first_name', 'last_name', 'phone'],
        },
        { model: StudentProfile, as: 'studentProfile', attributes: ['first_name', 'last_name', 'email'] },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'email', 'first_name', 'last_name'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return res.json({
      success: true,
      data: {
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        applications,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Administrative: Fetch single application with full profiles for review.
 */
const getAdminApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const application = await MembershipApplication.findByPk(id, {
      include: [
        {
          model: User,
          as: 'applicant',
          attributes: ['id', 'email', 'first_name', 'last_name', 'phone', 'status'],
        },
        { model: StudentProfile, as: 'studentProfile', attributes: { exclude: ['document_storage_key'] } },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'email', 'first_name', 'last_name'],
        },
      ],
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.',
      });
    }

    const individualProfile = application.user_id ? await IndividualProfile.findOne({ where: { user_id: application.user_id } }) : null;
    const corporateProfile = application.user_id ? await CorporateProfile.findOne({
      where: { user_id: application.user_id },
      include: [{ model: CorporateRepresentative, as: 'representatives' }],
    }) : null;

    const statusHistory = await MembershipStatusHistory.findAll({
      where: { application_id: application.id },
      include: [{ model: User, as: 'changedByUser', attributes: ['id', 'first_name', 'last_name'] }],
      order: [['created_at', 'ASC']],
    });

    return res.json({
      success: true,
      data: {
        application,
        profiles: {
          individual: individualProfile,
          corporate: corporateProfile,
          student: application.studentProfile,
        },
        statusHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Administrative: Move application to UNDER_REVIEW status.
 */
const reviewApplication = async (req, res, next) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const { id } = req.params;
    const application = await MembershipApplication.findByPk(id, { transaction });

    if (!application) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (!isAllowedTransition(application.status, 'UNDER_REVIEW')) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: `Invalid status transition: Cannot move application from '${application.status}' to 'UNDER_REVIEW'.`,
      });
    }

    const oldStatus = application.status;
    application.status = 'UNDER_REVIEW';
    application.reviewed_by = req.user.id;
    application.reviewed_at = new Date();
    await application.save({ transaction });

    await MembershipStatusHistory.create(
      {
        application_id: application.id,
        old_status: oldStatus,
        new_status: 'UNDER_REVIEW',
        changed_by: req.user.id,
        reason: 'Application placed under review by EXCO',
      },
      { transaction }
    );

    await AuditLog.create(
      {
        user_id: req.user.id,
        action: 'REVIEW_APPLICATION',
        module: 'MEMBERSHIP',
        entity_type: 'MembershipApplication',
        entity_id: String(application.id),
        old_values: { status: oldStatus },
        new_values: { status: 'UNDER_REVIEW' },
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
      },
      { transaction }
    );

    await transaction.commit();

    return res.json({
      success: true,
      message: 'Application marked under review.',
      data: application,
    });
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    next(error);
  }
};

/**
 * Administrative: Approve application (Transitions to PAYMENT_PENDING).
 * NOTE: APPROVAL != ACTIVATION. Payment and membership activation are separate future steps.
 */
const approveApplication = async (req, res, next) => {
  let transaction;
  try {
    const remarks = parseReviewRemarks(req.body);
    if (remarks.error) return res.status(400).json({ success: false, message: remarks.error });
    transaction = await sequelize.transaction();
    const { id } = req.params;

    const application = await MembershipApplication.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!application) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const alreadyApproved = application.status === 'PAYMENT_PENDING';
    if (alreadyApproved) {
      const currentPayment = await Payment.findOne({ where: { application_id: application.id }, include: [{ model: Invoice, as: 'invoice' }], transaction, lock: transaction.LOCK.UPDATE });
      if (currentPayment?.invoice) {
        await transaction.commit();
        return res.json({ success: true, message: 'Application is already approved and its invoice is ready.', data: { application, payment: currentPayment, invoice: currentPayment.invoice } });
      }
    }
    if (!alreadyApproved && !isAllowedTransition(application.status, 'PAYMENT_PENDING')) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: `Invalid status transition: Cannot approve application from status '${application.status}'.`,
      });
    }

    const oldStatus = application.status;
    let feeDetails;
    try { feeDetails = calculateMembershipFee({ membershipType: application.membership_type, discount: 0 }); }
    catch (error) { await transaction.rollback(); return res.status(error.statusCode || 409).json({ success: false, message: error.message }); }
    let existingPayment = await Payment.findOne({ where: { application_id: application.id }, transaction, lock: transaction.LOCK.UPDATE });
    const period = calculateMembershipPeriod(new Date());
    const dueAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    if (!existingPayment) {
      const paymentRef = await generatePaymentReference();
      existingPayment = await Payment.create({
        payment_reference: paymentRef, application_id: application.id, user_id: application.user_id,
        purpose: 'MEMBERSHIP', amount: feeDetails.total, currency: feeDetails.currency,
        payment_method: 'BANK_TRANSFER', payment_status: 'PENDING',
      }, { transaction });
    }
    const existingInvoice = await Invoice.findOne({ where: { payment_id: existingPayment.id }, transaction, lock: transaction.LOCK.UPDATE });
    if (!existingInvoice) {
      const invoiceNumber = await generateInvoiceNumber();
      await Invoice.create({
        invoice_number: invoiceNumber, payment_id: existingPayment.id, application_id: application.id,
        user_id: application.user_id, membership_type: application.membership_type,
        description: `${application.membership_type} membership (${period.start_date} to ${period.end_date})`,
        period_start: period.start_date, period_end: period.end_date,
        subtotal: feeDetails.subtotal, discount: 0, total: feeDetails.total, currency: feeDetails.currency,
        status: 'ISSUED', issued_at: new Date(), due_at: dueAt,
      }, { transaction });
    }

    if (!alreadyApproved) {
      application.status = 'PAYMENT_PENDING';
      application.approved_at = new Date();
      application.reviewed_at = new Date();
      application.reviewed_by = req.user.id;
      application.review_remarks = remarks.value || 'Application approved by EXCO. Payment requested.';
      await application.save({ transaction });
    }

    if (!alreadyApproved) await MembershipStatusHistory.create(
      {
        application_id: application.id,
        old_status: oldStatus,
        new_status: 'PAYMENT_PENDING',
        changed_by: req.user.id,
        reason: application.review_remarks,
      },
      { transaction }
    );

    if (!alreadyApproved) await AuditLog.create(
      {
        user_id: req.user.id,
        action: 'APPROVE_APPLICATION',
        module: 'MEMBERSHIP',
        entity_type: 'MembershipApplication',
        entity_id: String(application.id),
        old_values: { status: oldStatus },
        new_values: { status: 'PAYMENT_PENDING', review_remarks: application.review_remarks },
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
      },
      { transaction }
    );

    await transaction.commit();

      return res.json({
      success: true,
        message: 'Application approved. Invoice and payment record are available in the Member Portal.',
      data: application,
    });
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    next(error);
  }
};

/**
 * Administrative: Reject application.
 */
const rejectApplication = async (req, res, next) => {
  let transaction;
  try {
    const { id } = req.params;
    const remarks = parseReviewRemarks(req.body, true);
    if (remarks.error) return res.status(400).json({ success: false, message: remarks.error });
    transaction = await sequelize.transaction();

    const application = await MembershipApplication.findByPk(id, { transaction });
    if (!application) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (!isAllowedTransition(application.status, 'REJECTED')) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: `Invalid status transition: Cannot reject application from status '${application.status}'.`,
      });
    }

    const oldStatus = application.status;
    application.status = 'REJECTED';
    application.rejected_at = new Date();
    application.reviewed_at = new Date();
    application.reviewed_by = req.user.id;
    application.review_remarks = remarks.value;
    await application.save({ transaction });

    await MembershipStatusHistory.create(
      {
        application_id: application.id,
        old_status: oldStatus,
        new_status: 'REJECTED',
        changed_by: req.user.id,
        reason: application.review_remarks,
      },
      { transaction }
    );

    await AuditLog.create(
      {
        user_id: req.user.id,
        action: 'REJECT_APPLICATION',
        module: 'MEMBERSHIP',
        entity_type: 'MembershipApplication',
        entity_id: String(application.id),
        old_values: { status: oldStatus },
        new_values: { status: 'REJECTED', review_remarks: application.review_remarks },
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
      },
      { transaction }
    );

    await transaction.commit();

    return res.json({
      success: true,
      message: 'Application rejected.',
      data: application,
    });
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    next(error);
  }
};

/**
 * Administrative: Request clarification from applicant.
 */
const requestClarification = async (req, res, next) => {
  let transaction;
  try {
    const { id } = req.params;
    const remarks = parseReviewRemarks(req.body, true);
    if (remarks.error) return res.status(400).json({ success: false, message: remarks.error });
    transaction = await sequelize.transaction();

    const application = await MembershipApplication.findByPk(id, { transaction });
    if (!application) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (!isAllowedTransition(application.status, 'CLARIFICATION_REQUIRED')) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: `Invalid status transition: Cannot request clarification for application in status '${application.status}'.`,
      });
    }

    const oldStatus = application.status;
    application.status = 'CLARIFICATION_REQUIRED';
    application.reviewed_at = new Date();
    application.reviewed_by = req.user.id;
    application.review_remarks = remarks.value;
    await application.save({ transaction });

    await MembershipStatusHistory.create(
      {
        application_id: application.id,
        old_status: oldStatus,
        new_status: 'CLARIFICATION_REQUIRED',
        changed_by: req.user.id,
        reason: application.review_remarks,
      },
      { transaction }
    );

    await AuditLog.create(
      {
        user_id: req.user.id,
        action: 'REQUEST_CLARIFICATION',
        module: 'MEMBERSHIP',
        entity_type: 'MembershipApplication',
        entity_id: String(application.id),
        old_values: { status: oldStatus },
        new_values: { status: 'CLARIFICATION_REQUIRED', review_remarks: application.review_remarks },
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
      },
      { transaction }
    );

    await transaction.commit();

    return res.json({
      success: true,
      message: 'Clarification requested from applicant.',
      data: application,
    });
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    next(error);
  }
};

module.exports = {
  validateApplicationBody,
  submitApplication,
  getMyApplications,
  getMyApplicationById,
  resubmitApplicationClarification,
  getAdminApplications,
  getAdminApplicationById,
  reviewApplication,
  approveApplication,
  rejectApplication,
  requestClarification,
};
