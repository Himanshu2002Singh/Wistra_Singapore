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
} = require('../models');
const { generateApplicationNumber } = require('../utils/applicationNumber');
const { Op } = require('sequelize');

/**
 * Allowed status transitions for Membership Applications.
 */
const ALLOWED_TRANSITIONS = {
  PENDING: ['UNDER_REVIEW', 'CLARIFICATION_REQUIRED', 'REJECTED', 'PAYMENT_PENDING'],
  UNDER_REVIEW: ['PAYMENT_PENDING', 'CLARIFICATION_REQUIRED', 'REJECTED'],
  CLARIFICATION_REQUIRED: ['UNDER_REVIEW', 'PENDING', 'PAYMENT_PENDING', 'REJECTED'],
  PAYMENT_PENDING: [], // Locked until payment processing in later step
  REJECTED: [], // Terminal state
  APPROVED: [], // Terminal / Locked
};

const isAllowedTransition = (currentStatus, targetStatus) => {
  if (currentStatus === targetStatus) return true;
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  return Array.isArray(allowed) && allowed.includes(targetStatus);
};


/**
 * Submit a new Individual or Corporate Membership Application.
 */
const submitApplication = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
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
      // Corporate fields
      company_name,
      company_description,
      invoicing_contact_person,
      invoicing_email,
      contact_phone,
      main_contacts,
      additional_contacts,
      representatives,
    } = req.body;

    if (!membership_type || !['INDIVIDUAL', 'CORPORATE'].includes(membership_type)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Valid membership_type (INDIVIDUAL or CORPORATE) is required.',
      });
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
    await transaction.rollback();
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

    return res.json({
      success: true,
      data: application,
    });
  } catch (error) {
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

    const individualProfile = await IndividualProfile.findOne({ where: { user_id: application.user_id } });
    const corporateProfile = await CorporateProfile.findOne({
      where: { user_id: application.user_id },
      include: [{ model: CorporateRepresentative, as: 'representatives' }],
    });

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
  const transaction = await sequelize.transaction();
  try {
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
    await transaction.rollback();
    next(error);
  }
};

/**
 * Administrative: Approve application (Transitions to PAYMENT_PENDING).
 * NOTE: APPROVAL != ACTIVATION. Payment and membership activation are separate future steps.
 */
const approveApplication = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { review_remarks } = req.body;

    const application = await MembershipApplication.findByPk(id, { transaction });
    if (!application) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (!isAllowedTransition(application.status, 'PAYMENT_PENDING')) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: `Invalid status transition: Cannot approve application from status '${application.status}'.`,
      });
    }

    const oldStatus = application.status;
    application.status = 'PAYMENT_PENDING';
    application.approved_at = new Date();
    application.reviewed_at = new Date();
    application.reviewed_by = req.user.id;
    application.review_remarks = review_remarks || 'Application approved by EXCO. Payment requested.';
    await application.save({ transaction });

    await MembershipStatusHistory.create(
      {
        application_id: application.id,
        old_status: oldStatus,
        new_status: 'PAYMENT_PENDING',
        changed_by: req.user.id,
        reason: application.review_remarks,
      },
      { transaction }
    );

    await AuditLog.create(
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
      message: 'Application approved. Payment requested from applicant.',
      data: application,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Administrative: Reject application.
 */
const rejectApplication = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { review_remarks } = req.body;

    if (!review_remarks || !review_remarks.trim()) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Rejection reason/remarks are required.',
      });
    }

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
    application.review_remarks = review_remarks.trim();
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
    await transaction.rollback();
    next(error);
  }
};

/**
 * Administrative: Request clarification from applicant.
 */
const requestClarification = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { review_remarks } = req.body;

    if (!review_remarks || !review_remarks.trim()) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Clarification notes/remarks are required.',
      });
    }

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
    application.review_remarks = review_remarks.trim();
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
    await transaction.rollback();
    next(error);
  }
};

module.exports = {
  submitApplication,
  getMyApplications,
  getMyApplicationById,
  getAdminApplications,
  getAdminApplicationById,
  reviewApplication,
  approveApplication,
  rejectApplication,
  requestClarification,
};
