'use strict';

/**
 * Approved WISTA Singapore Membership Fee Structure (in SGD)
 */
const FEE_STRUCTURE = {
  INDIVIDUAL: 150.00,
  CORPORATE: 500.00,
  // Use SGD 50 as the initial Student fee; deployments can override it through Finance configuration.
  STUDENT: Number.isFinite(Number(process.env.STUDENT_MEMBERSHIP_FEE)) && Number(process.env.STUDENT_MEMBERSHIP_FEE) > 0
    ? Number(process.env.STUDENT_MEMBERSHIP_FEE)
    : 50.00,
};

/**
 * Calculate membership fee server-side.
 * Formula: subtotal - discount = total payable (min 0.00)
 *
 * @param {Object} params
 * @param {string} params.membershipType - 'INDIVIDUAL' | 'CORPORATE'
 * @param {number} [params.discount=0] - Discount amount in SGD
 * @param {boolean} [params.isComplimentary=false] - Whether payment is complimentary
 * @returns {{ subtotal: number, discount: number, total: number, currency: string }}
 */
const calculateMembershipFee = ({ membershipType, discount = 0, isComplimentary = false }) => {
  const typeKey = String(membershipType).toUpperCase();
  if (!Object.hasOwn(FEE_STRUCTURE, typeKey)) {
    const error = new Error(`Invalid membership type: ${membershipType}`);
    error.statusCode = 400;
    throw error;
  }

  const subtotal = FEE_STRUCTURE[typeKey];

  if (isComplimentary) {
    return {
      subtotal,
      discount: subtotal,
      total: 0.00,
      currency: 'SGD',
    };
  }

  const numericDiscount = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - numericDiscount);

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(numericDiscount.toFixed(2)),
    total: Number(total.toFixed(2)),
    currency: 'SGD',
  };
};

module.exports = {
  FEE_STRUCTURE,
  calculateMembershipFee,
};
