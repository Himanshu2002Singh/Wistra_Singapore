'use strict';

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticate');
const {
  createPayment,
  submitPaymentDetails,
  getMyPayments,
} = require('../controllers/paymentController');

router.post('/', authenticateToken, createPayment);
router.post('/:id/submit', authenticateToken, submitPaymentDetails);
router.get('/my', authenticateToken, getMyPayments);

module.exports = router;
