'use strict';

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticate');
const requirePermission = require('../middleware/requirePermission');
const {
  getAdminApplications,
  getAdminApplicationById,
  reviewApplication,
  approveApplication,
  rejectApplication,
  requestClarification,
} = require('../controllers/membershipApplicationController');

// Admin / EXCO Application Management routes
router.get(
  '/',
  authenticateToken,
  requirePermission('applications.read', 'applications.manage', 'applications.view'),
  getAdminApplications
);

router.get(
  '/:id',
  authenticateToken,
  requirePermission('applications.read', 'applications.manage', 'applications.view'),
  getAdminApplicationById
);

router.patch(
  '/:id/review',
  authenticateToken,
  requirePermission('applications.manage', 'applications.approve'),
  reviewApplication
);

router.patch(
  '/:id/approve',
  authenticateToken,
  requirePermission('applications.manage', 'applications.approve'),
  approveApplication
);

router.patch(
  '/:id/reject',
  authenticateToken,
  requirePermission('applications.manage', 'applications.reject'),
  rejectApplication
);

router.patch(
  '/:id/clarification',
  authenticateToken,
  requirePermission('applications.manage'),
  requestClarification
);

module.exports = router;
