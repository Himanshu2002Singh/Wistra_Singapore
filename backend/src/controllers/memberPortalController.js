'use strict';

const {
  sequelize,
  Membership,
  MembershipApplication,
  MembershipStatusHistory,
  User,
  IndividualProfile,
  CorporateProfile,
  CorporateRepresentative,
  Payment,
  Invoice,
  DirectoryPrivacySettings,
  AuditLog,
} = require('../models');
const { getEffectiveMembershipStatus } = require('../services/membershipActivationService');
const { Op } = require('sequelize');

const toMemberIdentity = (user) => ({
  id: user.id,
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
  phone: user.phone,
  profile_photo: user.profile_photo,
});

/** Return only status history tied to records owned by the authenticated member. */
const getMyActivity = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const requestedPageSize = Number.parseInt(req.query.pageSize, 10) || 10;
    const pageSize = Math.min(50, Math.max(1, requestedPageSize));
    const userId = req.user.id;

    const [applications, memberships] = await Promise.all([
      MembershipApplication.findAll({ where: { user_id: userId }, attributes: ['id'], raw: true }),
      Membership.findAll({ where: { user_id: userId }, attributes: ['id'], raw: true }),
    ]);
    const ownershipFilters = [];
    if (applications.length) ownershipFilters.push({ application_id: { [Op.in]: applications.map(({ id }) => id) } });
    if (memberships.length) ownershipFilters.push({ membership_id: { [Op.in]: memberships.map(({ id }) => id) } });

    const where = ownershipFilters.length ? { [Op.or]: ownershipFilters } : { id: { [Op.eq]: null } };
    const { count, rows } = await MembershipStatusHistory.findAndCountAll({
      where,
      attributes: ['id', 'application_id', 'membership_id', 'old_status', 'new_status', 'created_at'],
      order: [['created_at', 'DESC'], ['id', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    const totalPages = Math.ceil(count / pageSize);

    return res.json({
      success: true,
      data: {
        activities: rows.map((row) => ({
          id: row.id,
          type: row.application_id ? 'application' : 'membership',
          oldStatus: row.old_status,
          newStatus: row.new_status,
          createdAt: row.created_at,
        })),
        pagination: {
          page,
          pageSize,
          total: count,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get authenticated user's current membership info, digital card payload, and dashboard summary.
 */
const getMyMembership = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Find latest membership record
    const membership = await Membership.findOne({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email', 'phone'] },
      ],
    });

    const individualProfile = await IndividualProfile.findOne({
      where: { user_id: userId },
      attributes: ['company', 'designation', 'biography', 'linkedin_url', 'photo_url'],
    });
    const corporateProfile = await CorporateProfile.findOne({
      where: { user_id: userId },
      attributes: ['id', 'company_name', 'company_description', 'website'],
      include: [{
        model: CorporateRepresentative,
        as: 'representatives',
        attributes: ['id', 'user_id', 'designation', 'is_primary'],
      }],
    });
    const privacySettings = await DirectoryPrivacySettings.findOne({ where: { user_id: userId } });

    if (!membership) {
      return res.json({
        success: true,
        data: {
          has_membership: false,
          effective_status: 'INACTIVE',
          membership: null,
          user: toMemberIdentity(req.user),
          privacySettings,
          profiles: {
            individual: individualProfile,
            corporate: corporateProfile,
          },
        },
      });
    }

    const effectiveStatus = getEffectiveMembershipStatus(membership);

    // Determine company name
    let companyName = 'N/A';
    if (membership.membership_type === 'INDIVIDUAL') {
      companyName = individualProfile?.company || 'N/A';
    } else if (membership.membership_type === 'CORPORATE') {
      companyName = corporateProfile?.company_name || 'N/A';
    }

    // Calculate days remaining
    let daysRemaining = 0;
    if (membership.end_date) {
      const today = new Date();
      const end = new Date(membership.end_date);
      const diffTime = end - today;
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    // Format Digital Card payload
    const digitalCard = {
      member_name: `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim(),
      membership_number: membership.membership_number,
      membership_type: membership.membership_type === 'CORPORATE' ? 'Corporate Member' : 'Individual Member',
      company: companyName,
      valid_from: membership.start_date,
      valid_thru: membership.end_date ? membership.end_date.split('-').slice(1).join('/') : 'N/A', // e.g. 05/2027
      status: effectiveStatus,
      branding: 'WISTA Singapore',
    };

    // Format Dashboard summary payload
    const dashboardSummary = {
      status: effectiveStatus,
      membership_number: membership.membership_number,
      membership_type: membership.membership_type,
      start_date: membership.start_date,
      expiry_date: membership.end_date,
      days_remaining: daysRemaining,
      company: companyName,
    };

    return res.json({
      success: true,
      data: {
        has_membership: true,
        effective_status: effectiveStatus,
        membership,
        user: toMemberIdentity(req.user),
        card: digitalCard,
        dashboard: dashboardSummary,
        privacySettings,
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

/** Update account-owned fields and directory privacy settings for the JWT user. */
const updateMyProfile = async (req, res, next) => {
  let transaction;
  try {
    const body = req.body || {};
    const allowedFields = ['first_name', 'last_name', 'phone', 'privacy'];
    const unsupportedFields = Object.keys(body).filter((field) => !allowedFields.includes(field));
    if (unsupportedFields.length) {
      return res.status(400).json({ success: false, message: 'Only account contact details and directory privacy settings can be changed here.' });
    }

    const hasUserFields = ['first_name', 'last_name', 'phone'].some((field) => Object.prototype.hasOwnProperty.call(body, field));
    const privacy = body.privacy;
    if (!hasUserFields && privacy === undefined) {
      return res.status(400).json({ success: false, message: 'Provide at least one supported profile change.' });
    }

    const updates = {};
    for (const field of ['first_name', 'last_name']) {
      if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
      if (typeof body[field] !== 'string' || !body[field].trim() || body[field].trim().length > 100) {
        return res.status(400).json({ success: false, message: `${field} must be a non-empty string of at most 100 characters.` });
      }
      updates[field] = body[field].trim();
    }
    if (Object.prototype.hasOwnProperty.call(body, 'phone')) {
      if (body.phone !== null && (typeof body.phone !== 'string' || body.phone.trim().length > 20)) {
        return res.status(400).json({ success: false, message: 'phone must be a string of at most 20 characters or null.' });
      }
      updates.phone = typeof body.phone === 'string' ? (body.phone.trim() || null) : null;
    }

    const privacyFields = [
      'show_email', 'show_phone', 'show_company', 'show_designation',
      'show_bio', 'show_linkedin', 'show_photo',
    ];
    if (privacy !== undefined) {
      if (!privacy || typeof privacy !== 'object' || Array.isArray(privacy)) {
        return res.status(400).json({ success: false, message: 'privacy must be an object of directory visibility settings.' });
      }
      const unsupportedPrivacyFields = Object.keys(privacy).filter((field) => !privacyFields.includes(field));
      if (unsupportedPrivacyFields.length) {
        return res.status(400).json({ success: false, message: 'One or more directory visibility settings are unsupported.' });
      }
      for (const field of Object.keys(privacy)) {
        if (typeof privacy[field] !== 'boolean') {
          return res.status(400).json({ success: false, message: 'Directory visibility settings must be true or false.' });
        }
      }
      if (!Object.keys(privacy).length) {
        return res.status(400).json({ success: false, message: 'Provide at least one directory visibility setting.' });
      }
    }

    transaction = await sequelize.transaction();
    const user = await User.findByPk(req.user.id, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Member account was not found.' });
    }

    const oldValues = {};
    const newValues = {};
    for (const [field, value] of Object.entries(updates)) {
      if (user[field] !== value) {
        oldValues[field] = user[field];
        newValues[field] = value;
      }
    }

    Object.assign(user, updates);
    if (hasUserFields) await user.save({ transaction });

    let privacySettings = null;
    if (privacy !== undefined) {
      privacySettings = await DirectoryPrivacySettings.findOne({ where: { user_id: req.user.id }, transaction });
      if (!privacySettings) {
        privacySettings = await DirectoryPrivacySettings.create({ user_id: req.user.id }, { transaction });
      }
      for (const field of privacyFields) {
        if (!Object.prototype.hasOwnProperty.call(privacy, field)) continue;
        if (privacySettings[field] !== privacy[field]) {
          oldValues[field] = privacySettings[field];
          newValues[field] = privacy[field];
        }
        privacySettings[field] = privacy[field];
      }
      await privacySettings.save({ transaction });
    }

    if (Object.keys(newValues).length) {
      await AuditLog.create({
        user_id: req.user.id,
        action: 'PROFILE_UPDATED',
        module: 'MEMBER_PROFILE',
        entity_type: 'User',
        entity_id: String(user.id),
        old_values: oldValues,
        new_values: newValues,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
      }, { transaction });
    }

    await transaction.commit();
    return res.json({
      success: true,
      message: 'Profile changes saved.',
      data: { user: toMemberIdentity(user), privacySettings },
    });
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    next(error);
  }
};

module.exports = {
  getMyActivity,
  getMyMembership,
  updateMyProfile,
};
