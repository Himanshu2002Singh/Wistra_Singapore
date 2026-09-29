'use strict';

const {
  Membership,
  User,
  IndividualProfile,
  CorporateProfile,
  CorporateRepresentative,
  Payment,
  Invoice,
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

    if (!membership) {
      return res.json({
        success: true,
        data: {
          has_membership: false,
          effective_status: 'INACTIVE',
          membership: null,
          user: req.user,
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

module.exports = {
  getMyMembership,
};
