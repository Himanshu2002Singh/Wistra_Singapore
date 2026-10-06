'use strict';

const {
  sequelize,
  Membership,
  User,
  MembershipApplication,
  IndividualProfile,
  CorporateProfile,
  CorporateRepresentative,
  MembershipStatusHistory,
  AuditLog,
} = require('../models');
const {
  activateMembership,
  getEffectiveMembershipStatus,
  processExpiredMemberships,
} = require('../services/membershipActivationService');
const { Op } = require('sequelize');

/**
 * Administrative: List all memberships with search, filters, pagination.
 */
const getAdminMemberships = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const { status, membership_type, search } = req.query;
    const where = {};
    const andConditions = [];

    if (status && status !== 'All') {
      if (status === 'EXPIRED') {
        andConditions.push({
          [Op.or]: [
            { status: 'EXPIRED' },
            { status: 'ACTIVE', end_date: { [Op.lt]: new Date().toISOString().split('T')[0] } },
          ],
        });
      } else if (status === 'ACTIVE') {
        where.status = 'ACTIVE';
        andConditions.push({
          [Op.or]: [
            { end_date: null },
            { end_date: { [Op.gte]: new Date().toISOString().split('T')[0] } },
          ],
        });
      } else {
        where.status = status;
      }
    }
    if (membership_type && membership_type !== 'All') where.membership_type = membership_type;

    if (search) {
      andConditions.push({ [Op.or]: [
        { membership_number: { [Op.like]: `%${search}%` } },
        { '$user.email$': { [Op.like]: `%${search}%` } },
        { '$user.first_name$': { [Op.like]: `%${search}%` } },
        { '$user.last_name$': { [Op.like]: `%${search}%` } },
        { '$user.individualProfile.company$': { [Op.like]: `%${search}%` } },
        { '$user.individualProfile.designation$': { [Op.like]: `%${search}%` } },
        { '$user.corporateProfile.company_name$': { [Op.like]: `%${search}%` } },
      ] });
    }

    if (andConditions.length) where[Op.and] = andConditions;

    const { count, rows: memberships } = await Membership.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'first_name', 'last_name', 'phone'],
          include: [
            {
              model: IndividualProfile,
              as: 'individualProfile',
              attributes: ['company', 'designation'],
              required: false,
            },
            {
              model: CorporateProfile,
              as: 'corporateProfile',
              attributes: ['company_name'],
              required: false,
            },
          ],
        },
        {
          model: MembershipApplication,
          as: 'application',
          attributes: ['id', 'application_number', 'membership_type', 'status', 'submitted_at', 'approved_at'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    const formatted = memberships.map((m) => {
      const plain = m.get({ plain: true });
      plain.effective_status = getEffectiveMembershipStatus(m);
      plain.company = plain.user?.individualProfile?.company || plain.user?.corporateProfile?.company_name || null;
      plain.designation = plain.user?.individualProfile?.designation || null;
      if (plain.user) {
        delete plain.user.individualProfile;
        delete plain.user.corporateProfile;
      }
      return plain;
    });

    return res.json({
      success: true,
      data: {
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        memberships: formatted,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Administrative: Fetch single membership details with history and profiles.
 */
const getAdminMembershipById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const membership = await Membership.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'first_name', 'last_name', 'phone', 'status'] },
        { model: User, as: 'activator', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: MembershipApplication, as: 'application' },
      ],
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership record not found.',
      });
    }

    const plain = membership.get({ plain: true });
    plain.effective_status = getEffectiveMembershipStatus(membership);

    const individualProfile = await IndividualProfile.findOne({ where: { user_id: membership.user_id } });
    const corporateProfile = await CorporateProfile.findOne({
      where: { user_id: membership.user_id },
      include: [{ model: CorporateRepresentative, as: 'representatives' }],
    });

    const statusHistory = await MembershipStatusHistory.findAll({
      where: { membership_id: membership.id },
      include: [{ model: User, as: 'changedByUser', attributes: ['id', 'first_name', 'last_name'] }],
      order: [['created_at', 'ASC']],
    });

    return res.json({
      success: true,
      data: {
        membership: plain,
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
 * Administrative: Trigger manual activation of an approved + paid application.
 */
const activateApprovedMembership = async (req, res, next) => {
  try {
    const { application_id } = req.body;
    if (!application_id) {
      return res.status(400).json({ success: false, message: 'application_id is required.' });
    }

    const membership = await activateMembership({
      applicationId: application_id,
      adminId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: `Membership activated successfully (${membership.membership_number}).`,
      data: membership,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * Administrative: Suspend an active membership.
 */
const suspendMembership = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Reason for suspension is required.',
      });
    }

    const membership = await Membership.findByPk(id, { transaction });
    if (!membership) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Membership record not found.' });
    }

    if (membership.status !== 'ACTIVE') {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: `Only ACTIVE memberships can be suspended. Current status is '${membership.status}'.`,
      });
    }

    const effectiveStatus = getEffectiveMembershipStatus(membership);
    if (effectiveStatus === 'EXPIRED') {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: 'Cannot suspend an expired membership.',
      });
    }

    const oldStatus = membership.status;
    membership.status = 'SUSPENDED';
    membership.suspended_at = new Date();
    await membership.save({ transaction });

    await MembershipStatusHistory.create(
      {
        membership_id: membership.id,
        application_id: membership.application_id,
        old_status: oldStatus,
        new_status: 'SUSPENDED',
        changed_by: req.user.id,
        reason: reason.trim(),
      },
      { transaction }
    );

    await AuditLog.create(
      {
        user_id: req.user.id,
        action: 'MEMBERSHIP_SUSPENDED',
        module: 'MEMBERSHIP',
        entity_type: 'Membership',
        entity_id: String(membership.id),
        old_values: { status: oldStatus },
        new_values: { status: 'SUSPENDED', reason: reason.trim() },
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
      },
      { transaction }
    );

    await transaction.commit();

    return res.json({
      success: true,
      message: 'Membership suspended successfully.',
      data: membership,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Administrative: Reactivate a suspended membership.
 */
const reactivateMembership = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const membership = await Membership.findByPk(id, { transaction });
    if (!membership) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Membership record not found.' });
    }

    if (membership.status !== 'SUSPENDED') {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: `Only SUSPENDED memberships can be reactivated. Current status is '${membership.status}'.`,
      });
    }

    // Check if membership is expired
    const effectiveStatus = getEffectiveMembershipStatus(membership);
    if (effectiveStatus === 'EXPIRED') {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: 'Cannot reactivate an expired membership. Renewal payment is required.',
      });
    }

    const oldStatus = membership.status;
    membership.status = 'ACTIVE';
    await membership.save({ transaction });

    await MembershipStatusHistory.create(
      {
        membership_id: membership.id,
        application_id: membership.application_id,
        old_status: oldStatus,
        new_status: 'ACTIVE',
        changed_by: req.user.id,
        reason: 'Membership reactivated by admin.',
      },
      { transaction }
    );

    await AuditLog.create(
      {
        user_id: req.user.id,
        action: 'MEMBERSHIP_REACTIVATED',
        module: 'MEMBERSHIP',
        entity_type: 'Membership',
        entity_id: String(membership.id),
        old_values: { status: oldStatus },
        new_values: { status: 'ACTIVE' },
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
      },
      { transaction }
    );

    await transaction.commit();

    return res.json({
      success: true,
      message: 'Membership reactivated successfully.',
      data: membership,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Administrative: Cancel a membership.
 */
const cancelMembership = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    if (!cancellation_reason || !cancellation_reason.trim()) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'cancellation_reason is required.',
      });
    }

    const membership = await Membership.findByPk(id, { transaction });
    if (!membership) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Membership record not found.' });
    }

    if (membership.status === 'CANCELLED') {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: 'Membership is already cancelled.',
      });
    }

    const effectiveStatus = getEffectiveMembershipStatus(membership);
    if (effectiveStatus === 'EXPIRED' || membership.status === 'EXPIRED') {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: 'Cannot cancel an expired membership.',
      });
    }

    const allowedCancelStatuses = ['ACTIVE', 'SUSPENDED', 'PENDING'];
    if (!allowedCancelStatuses.includes(membership.status)) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: `Cannot cancel membership with status '${membership.status}'.`,
      });
    }

    const oldStatus = membership.status;
    membership.status = 'CANCELLED';
    membership.cancelled_at = new Date();
    membership.cancellation_reason = cancellation_reason.trim();
    await membership.save({ transaction });

    await MembershipStatusHistory.create(
      {
        membership_id: membership.id,
        application_id: membership.application_id,
        old_status: oldStatus,
        new_status: 'CANCELLED',
        changed_by: req.user.id,
        reason: cancellation_reason.trim(),
      },
      { transaction }
    );

    await AuditLog.create(
      {
        user_id: req.user.id,
        action: 'MEMBERSHIP_CANCELLED',
        module: 'MEMBERSHIP',
        entity_type: 'Membership',
        entity_id: String(membership.id),
        old_values: { status: oldStatus },
        new_values: { status: 'CANCELLED', cancellation_reason: membership.cancellation_reason },
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
      },
      { transaction }
    );

    await transaction.commit();

    return res.json({
      success: true,
      message: 'Membership cancelled successfully.',
      data: membership,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Administrative: Process and transition all expired memberships from ACTIVE to EXPIRED.
 */
const processMembershipExpiry = async (req, res, next) => {
  try {
    const result = await processExpiredMemberships({
      adminId: req.user.id,
    });

    return res.json({
      success: true,
      message: `Processed expired memberships. ${result.processedCount} membership(s) transitioned to EXPIRED.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminMemberships,
  getAdminMembershipById,
  activateApprovedMembership,
  suspendMembership,
  reactivateMembership,
  cancelMembership,
  processMembershipExpiry,
};

