'use strict';

const express = require('express');
const router = express.Router();
const { submitContactMessage } = require('../controllers/contactController');
const createRateLimiter = require('../middleware/rateLimit');

router.post('/', createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 5,
  message: 'Too many contact submissions. Please try again later.',
}), submitContactMessage);

module.exports = router;
