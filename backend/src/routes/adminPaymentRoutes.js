'use strict';

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticate');
const requirePermission = require('../middleware/requirePermission');
const {
  getAdminPayments,
  getAdminPaymentById,
  verifyPayment,
  rejectPayment,
  refundPayment,
  createComplimentaryPayment,
} = require('../controllers/paymentController');

router.get(
  '/',
  authenticateToken,
  requirePermission('payments.read', 'payments.manage', 'payments.view', 'financials.manage'),
  getAdminPayments
);

router.get(
  '/:id',
  authenticateToken,
  requirePermission('payments.read', 'payments.manage', 'payments.view', 'financials.manage'),
  getAdminPaymentById
);

router.patch(
  '/:id/verify',
  authenticateToken,
  requirePermission('payments.manage', 'payments.verify', 'financials.manage'),
  verifyPayment
);

router.patch(
  '/:id/reject',
  authenticateToken,
  requirePermission('payments.manage', 'payments.reject', 'financials.manage'),
  rejectPayment
);

router.patch(
  '/:id/refund',
  authenticateToken,
  requirePermission('payments.manage', 'payments.refund', 'financials.manage'),
  refundPayment
);

router.post(
  '/complimentary',
  authenticateToken,
  requirePermission('payments.manage', 'financials.manage'),
  createComplimentaryPayment
);

module.exports = router;
