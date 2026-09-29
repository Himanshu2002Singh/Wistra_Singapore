'use strict';

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticate');
const requirePermission = require('../middleware/requirePermission');
const {
  getAdminMemberships,
  getAdminMembershipById,
  activateApprovedMembership,
  suspendMembership,
  reactivateMembership,
  cancelMembership,
} = require('../controllers/adminMembershipController');

router.get(
  '/',
  authenticateToken,
  requirePermission('membership.read', 'membership.manage', 'memberships.view'),
  getAdminMemberships
);

router.get(
  '/:id',
  authenticateToken,
  requirePermission('membership.read', 'membership.manage', 'memberships.view'),
  getAdminMembershipById
);

router.post(
  '/activate',
  authenticateToken,
  requirePermission('membership.manage', 'applications.approve'),
  activateApprovedMembership
);

router.patch(
  '/:id/suspend',
  authenticateToken,
  requirePermission('membership.manage'),
  suspendMembership
);

router.patch(
  '/:id/reactivate',
  authenticateToken,
  requirePermission('membership.manage'),
  reactivateMembership
);

router.patch(
  '/:id/cancel',
  authenticateToken,
  requirePermission('membership.manage'),
  cancelMembership
);

module.exports = router;
