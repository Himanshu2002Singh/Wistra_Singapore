'use strict';

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticate');
const { getInvoiceById } = require('../controllers/paymentController');

router.get('/:id', authenticateToken, getInvoiceById);
router.get('/:id/pdf', authenticateToken, getInvoiceById);

module.exports = router;
