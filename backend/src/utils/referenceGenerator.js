'use strict';

const { Payment, Invoice } = require('../models');
const { Op } = require('sequelize');

/**
 * Generate a unique server-side payment reference.
 * Format: PAY-YYYY-XXXXXX
 * @returns {Promise<string>}
 */
const generatePaymentReference = async () => {
  const year = new Date().getFullYear();
  const prefix = `PAY-${year}-`;

  const latestPayment = await Payment.findOne({
    where: {
      payment_reference: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['id', 'DESC']],
  });

  let nextSequence = 1;
  if (latestPayment && latestPayment.payment_reference) {
    const parts = latestPayment.payment_reference.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextSequence = lastNum + 1;
    }
  }

  const paddedNum = String(nextSequence).padStart(6, '0');
  return `${prefix}${paddedNum}`;
};

/**
 * Generate a unique server-side invoice number.
 * Format: WISTA-SG-YYYY-XXXXXX
 * @returns {Promise<string>}
 */
const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `WISTA-SG-${year}-`;

  const latestInvoice = await Invoice.findOne({
    where: {
      invoice_number: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['id', 'DESC']],
  });

  let nextSequence = 1;
  if (latestInvoice && latestInvoice.invoice_number) {
    const parts = latestInvoice.invoice_number.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextSequence = lastNum + 1;
    }
  }

  const paddedNum = String(nextSequence).padStart(6, '0');
  return `${prefix}${paddedNum}`;
};

module.exports = {
  generatePaymentReference,
  generateInvoiceNumber,
};
