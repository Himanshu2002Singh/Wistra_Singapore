'use strict';

const {
  sequelize,
  MembershipApplication,
  Membership,
  Payment,
  MembershipStatusHistory,
  AuditLog,
} = require('../models');
const { generateMembershipNumber } = require('../utils/membershipNumber');
const { Op } = require('sequelize');

/**
 * Calculate WISTA Singapore membership validity period.
 * WISTA Membership Year: 1 June to 31 May.
 *
 * @param {Date} [refDate=new Date()]
 * @returns {{ start_date: string, end_date: string }}
 */
const calculateMembershipPeriod = (refDate = new Date()) => {
  const date = new Date(refDate);
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed (5 = June)

  let startYear, endYear;
  if (month >= 5) {
    // June to Dec: Membership year is June YYYY -> May YYYY+1
    startYear = year;
    endYear = year + 1;
  } else {
    // Jan to May: Membership year is June YYYY-1 -> May YYYY
    startYear = year - 1;
    endYear = year;
  }

  const start_date = `${startYear}-06-01`;
  const end_date = `${endYear}-05-31`;

  return { start_date, end_date };
};

/**
 * Compute effective status dynamically checking for expiry.
 *
 * @param {Object} membership
 * @returns {string}
 */
const getEffectiveMembershipStatus = (membership) => {
  if (!membership) return 'INACTIVE';
  if (membership.status === 'ACTIVE' && membership.end_date) {
    const todayStr = new Date().toISOString().split('T')[0];
    if (todayStr > membership.end_date) {
      return 'EXPIRED';
    }
  }
  return membership.status;
};

/**
 * Activate a membership for an approved & paid application.
 *
 * @param {Object} params
 * @param {number} params.applicationId
 * @param {number} params.adminId - User ID of executing admin
 * @param {Object} [params.transaction] - Optional existing transaction
 * @returns {Promise<Object>} The activated Membership record
 */
const activateMembership = async ({ applicationId, adminId, transaction: externalTx }) => {
  const transaction = externalTx || (await sequelize.transaction());
  const isSelfManagedTx = !externalTx;

  try {
    // 1. Fetch application
    const application = await MembershipApplication.findByPk(applicationId, { transaction });
    if (!application) {
      throw new Error('Membership application not found.');
    }

    if (!['PAYMENT_PENDING', 'APPROVED'].includes(application.status)) {
      const err = new Error(`Cannot activate membership for application in status '${application.status}'. Application must be approved.`);
      err.statusCode = 409;
      throw err;
    }

    // 2. Verify PAID payment exists
    const paidPayment = await Payment.findOne({
      where: {
        application_id: applicationId,
        payment_status: 'PAID',
      },
      transaction,
    });

    if (!paidPayment) {
      const err = new Error('Cannot activate membership: No verified PAID payment found for this application.');
      err.statusCode = 409;
      throw err;
    }

    // 3. Prevent duplicate active membership
    const existingMembership = await Membership.findOne({
      where: {
        user_id: application.user_id,
        status: {
          [Op.in]: ['ACTIVE', 'SUSPENDED'],
        },
      },
      transaction,
    });

    if (existingMembership) {
      const err = new Error(`User already has an active or suspended membership (${existingMembership.membership_number}).`);
      err.statusCode = 409;
      throw err;
    }

    // 4. Calculate Period & Generate Number
    const period = calculateMembershipPeriod(new Date());
    const membershipNumber = await generateMembershipNumber();
    const now = new Date();

    // 5. Create Membership record
    const membership = await Membership.create(
      {
        user_id: application.user_id,
        application_id: application.id,
        membership_type: application.membership_type,
        membership_number: membershipNumber,
        status: 'ACTIVE',
        start_date: period.start_date,
        end_date: period.end_date,
        fee: paidPayment.amount,
        activated_at: now,
        activated_by: adminId,
      },
      { transaction }
    );

    // Update payment record to point to new membership
    paidPayment.membership_id = membership.id;
    await paidPayment.save({ transaction });

    // 6. Record Status History
    await MembershipStatusHistory.create(
      {
        membership_id: membership.id,
        application_id: application.id,
        old_status: 'PENDING',
        new_status: 'ACTIVE',
        changed_by: adminId,
        reason: 'Membership activated following payment verification.',
      },
      { transaction }
    );

    // 7. Audit log
    await AuditLog.create(
      {
        user_id: adminId,
        action: 'MEMBERSHIP_ACTIVATED',
        module: 'MEMBERSHIP',
        entity_type: 'Membership',
        entity_id: String(membership.id),
        new_values: {
          membership_number: membershipNumber,
          status: 'ACTIVE',
          start_date: period.start_date,
          end_date: period.end_date,
        },
        ip_address: '127.0.0.1',
      },
      { transaction }
    );

    if (isSelfManagedTx) {
      await transaction.commit();
    }

    return membership;
  } catch (error) {
    if (isSelfManagedTx) {
      await transaction.rollback();
    }
    throw error;
  }
};

module.exports = {
  calculateMembershipPeriod,
  getEffectiveMembershipStatus,
  activateMembership,
};
