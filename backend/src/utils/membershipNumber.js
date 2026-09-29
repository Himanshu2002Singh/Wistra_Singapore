'use strict';

const { Membership } = require('../models');
const { Op } = require('sequelize');

/**
 * Generate a unique server-side membership number.
 * Format: WISTA-SG-XXXXXX
 * @returns {Promise<string>}
 */
const generateMembershipNumber = async () => {
  const prefix = 'WISTA-SG-';

  const latestMembership = await Membership.findOne({
    where: {
      membership_number: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['id', 'DESC']],
  });

  let nextSequence = 1;
  if (latestMembership && latestMembership.membership_number) {
    const parts = latestMembership.membership_number.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextSequence = lastNum + 1;
    }
  }

  const paddedNum = String(nextSequence).padStart(6, '0');
  return `${prefix}${paddedNum}`;
};

module.exports = {
  generateMembershipNumber,
};
