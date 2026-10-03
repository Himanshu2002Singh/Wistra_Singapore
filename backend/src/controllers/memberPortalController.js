'use strict';

const {
  sequelize,
  Membership,
  User,
  IndividualProfile,
  CorporateProfile,
  CorporateRepresentative,
  Payment,
  Invoice,
  DirectoryPrivacySettings,
} = require('../models');
const { getEffectiveMembershipStatus } = require('../services/membershipActivationService');

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

    const individualProfile = await IndividualProfile.findOne({ where: { user_id: userId } });
    const corporateProfile = await CorporateProfile.findOne({
      where: { user_id: userId },
      include: [{ model: CorporateRepresentative, as: 'representatives' }],
    });
    const privacySettings = await DirectoryPrivacySettings.findOne({ where: { user_id: userId } });

    if (!membership) {
      return res.json({
        success: true,
        data: {
          has_membership: false,
          effective_status: 'INACTIVE',
          membership: null,
          user: req.user,
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

    const privacyFields = ['show_email', 'show_phone', 'show_company'];
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

    Object.assign(user, updates);
    if (hasUserFields) await user.save({ transaction });

    let privacySettings = null;
    if (privacy !== undefined) {
      privacySettings = await DirectoryPrivacySettings.findOne({ where: { user_id: req.user.id }, transaction });
      if (!privacySettings) {
        privacySettings = await DirectoryPrivacySettings.create({ user_id: req.user.id }, { transaction });
      }
      for (const field of privacyFields) {
        if (Object.prototype.hasOwnProperty.call(privacy, field)) privacySettings[field] = privacy[field];
      }
      await privacySettings.save({ transaction });
    }

    await transaction.commit();
    const safeUser = user.toJSON();
    delete safeUser.password_hash;
    return res.json({
      success: true,
      message: 'Profile changes saved.',
      data: { user: safeUser, privacySettings },
    });
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    next(error);
  }
};

module.exports = {
  getMyMembership,
  updateMyProfile,
};
