'use strict';

const { MembershipApplication } = require('../models');

/**
 * Generate a unique, human-readable server-side application number.
 * Format: WISTA-APP-YYYY-XXXXXX
 * @returns {Promise<string>}
 */
const generateApplicationNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `WISTA-APP-${year}-`;

  // Find latest application for current year
  const latestApp = await MembershipApplication.findOne({
    where: {
      application_number: {
        [require('sequelize').Op.like]: `${prefix}%`,
      },
    },
    order: [['id', 'DESC']],
  });

  let nextSequence = 1;
  if (latestApp && latestApp.application_number) {
    const parts = latestApp.application_number.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextSequence = lastNum + 1;
    }
  }

  const paddedNum = String(nextSequence).padStart(6, '0');
  return `${prefix}${paddedNum}`;
};

module.exports = {
  generateApplicationNumber,
};
