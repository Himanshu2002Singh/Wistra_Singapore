'use strict';

const express = require('express');
const router = express.Router();
const { getAdminRoles, register, login, getMe, logout } = require('../controllers/authController');
const { requestPasswordReset, resetPassword } = require('../controllers/passwordResetController');
const authenticateToken = require('../middleware/authenticate');
const createRateLimiter = require('../middleware/rateLimit');

const passwordResetRequestLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: 'Too many password reset requests. Please try again later.',
});
const passwordResetLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: 'Too many password reset attempts. Please try again later.',
});
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
  message: 'Too many sign-in attempts. Please try again later.',
});
const registrationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 10,
  message: 'Too many registration attempts. Please try again later.',
});

router.get('/admin-roles', getAdminRoles);
router.post('/register', registrationLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/password-reset-requests', passwordResetRequestLimiter, requestPasswordReset);
router.post('/password-resets', passwordResetLimiter, resetPassword);
router.get('/me', authenticateToken, getMe);
router.post('/logout', authenticateToken, logout);

module.exports = router;
