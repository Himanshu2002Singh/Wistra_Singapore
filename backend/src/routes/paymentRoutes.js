'use strict';

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const {
  createPayment,
  submitPaymentDetails,
  getMyPayments,
} = require('../controllers/paymentController');

router.post('/', authenticateToken, requireRole('MEMBER', { allowSuperAdmin: false }), createPayment);
router.post('/:id/submit', authenticateToken, requireRole('MEMBER', { allowSuperAdmin: false }), submitPaymentDetails);
router.get('/my', authenticateToken, requireRole('MEMBER', { allowSuperAdmin: false }), getMyPayments);

module.exports = router;
