'use strict';

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const {
  createPayment,
  submitPaymentDetails,
  getMyPayments,
  getPaymentInstructions,
  getPayNowQr,
} = require('../controllers/paymentController');
const { paymentProofUpload } = require('../middleware/paymentProofUpload');

router.post('/', authenticateToken, requireRole('MEMBER', { allowSuperAdmin: false }), createPayment);
router.get('/instructions', authenticateToken, requireRole('MEMBER', { allowSuperAdmin: false }), getPaymentInstructions);
router.get('/instructions/paynow-qr', authenticateToken, requireRole('MEMBER', { allowSuperAdmin: false }), getPayNowQr);
router.post('/:id/submit', authenticateToken, requireRole('MEMBER', { allowSuperAdmin: false }), paymentProofUpload, submitPaymentDetails);
router.get('/my', authenticateToken, requireRole('MEMBER', { allowSuperAdmin: false }), getMyPayments);

module.exports = router;
