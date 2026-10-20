'use strict';

const { Membership, User, Role, IndividualProfile, CorporateProfile, DirectoryPrivacySettings } = require('../models');
const { getEffectiveMembershipStatus } = require('../services/membershipActivationService');

const PRIVACY_DEFAULTS = {
  show_email: true,
  show_phone: false,
  show_company: true,
  show_designation: true,
  show_bio: true,
  show_linkedin: true,
  show_photo: true,
};

const parsePositiveInteger = (value, fallback, maximum = Number.MAX_SAFE_INTEGER) => {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= maximum ? parsed : null;
};

const cleanText = (value) => typeof value === 'string' ? value.trim() : '';
const normalized = (value) => cleanText(value).toLocaleLowerCase();

const toDirectoryMember = (membership) => {
  const user = membership.user;
  const privacy = membership.user.privacySettings || PRIVACY_DEFAULTS;
  const individual = user.individualProfile;
  const corporate = user.corporateProfile;
  const isCorporateMember = membership.membership_type === 'CORPORATE';
  const rawCompany = isCorporateMember ? corporate?.company_name : individual?.company;

  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: privacy.show_email ? user.email : null,
    phone: privacy.show_phone ? user.phone : null,
    company: privacy.show_company ? (rawCompany || null) : null,
    designation: privacy.show_designation && !isCorporateMember ? (individual?.designation || null) : null,
    biography: privacy.show_bio && !isCorporateMember ? (individual?.biography || null) : null,
    linkedin_url: privacy.show_linkedin && !isCorporateMember ? (individual?.linkedin_url || null) : null,
    photo_url: privacy.show_photo ? (user.profile_photo || individual?.photo_url || null) : null,
  };
};

/** Return a paginated, privacy-filtered directory of members with a current active membership. */
const listMemberDirectory = async (req, res, next) => {
  try {
    const allowedQueryFields = new Set(['search', 'company', 'page', 'pageSize']);
    if (Object.keys(req.query).some((field) => !allowedQueryFields.has(field))) {
      return res.status(400).json({ success: false, message: 'One or more directory query parameters are unsupported.' });
    }

    const page = parsePositiveInteger(req.query.page, 1);
    const pageSize = parsePositiveInteger(req.query.pageSize, 12, 50);
    if (!page || !pageSize) {
      return res.status(400).json({ success: false, message: 'page must be a positive integer and pageSize must be between 1 and 50.' });
    }
    if ((req.query.search !== undefined && (typeof req.query.search !== 'string' || req.query.search.trim().length > 100))
      || (req.query.company !== undefined && (typeof req.query.company !== 'string' || req.query.company.trim().length > 255))) {
      return res.status(400).json({ success: false, message: 'search must be at most 100 characters and company must be at most 255 characters.' });
    }

    // Match the member portal's canonical latest-membership and effective-status behavior.
    const memberships = await Membership.findAll({
      attributes: ['id', 'user_id', 'membership_type', 'status', 'end_date', 'created_at'],
      order: [['created_at', 'DESC'], ['id', 'DESC']],
      include: [{
        model: User,
        as: 'user',
        required: true,
        attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'profile_photo', 'status'],
        where: { status: 'ACTIVE' },
        include: [
          { model: Role, as: 'role', required: true, attributes: [], where: { name: 'MEMBER' } },
          { model: IndividualProfile, as: 'individualProfile', attributes: ['company', 'designation', 'biography', 'linkedin_url', 'photo_url'] },
          { model: CorporateProfile, as: 'corporateProfile', attributes: ['company_name'] },
          { model: DirectoryPrivacySettings, as: 'privacySettings', attributes: Object.keys(PRIVACY_DEFAULTS) },
        ],
      }],
    });

    const latestByUser = new Map();
    for (const membership of memberships) {
      const userId = String(membership.user_id);
      if (!latestByUser.has(userId)) latestByUser.set(userId, membership);
    }

    const search = normalized(req.query.search);
    const companyFilter = normalized(req.query.company);
    const eligibleMembers = [...latestByUser.values()]
      .filter((membership) => getEffectiveMembershipStatus(membership) === 'ACTIVE')
      .map(toDirectoryMember);
    const companies = [...new Set(eligibleMembers.map((member) => member.company).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    const filtered = eligibleMembers
      .filter((member) => {
        const companyMatches = !companyFilter || normalized(member.company) === companyFilter;
        const searchable = [member.first_name, member.last_name, member.company, member.designation, member.biography]
          .filter(Boolean).join(' ').toLocaleLowerCase();
        return companyMatches && (!search || searchable.includes(search));
      })
      .sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`));

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const members = filtered.slice((page - 1) * pageSize, page * pageSize);
    return res.json({
      success: true,
      data: {
        members,
        filters: { companies },
        pagination: { page, pageSize, total, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { listMemberDirectory };
