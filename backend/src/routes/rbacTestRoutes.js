'use strict';

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const requirePermission = require('../middleware/requirePermission');

/**
 * Development / Testing routes to verify RBAC enforcement.
 */

// Super Admin Only Route
router.get(
  '/superadmin',
  authenticateToken,
  requireRole('SUPER_ADMIN'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Access granted to Super Admin module.',
      user: { id: req.user.id, role: req.user.role?.name },
    });
  }
);

// Membership Admin Module Route
router.get(
  '/membership',
  authenticateToken,
  requirePermission('members.read', 'applications.read', 'members.view'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Access granted to Membership module.',
      user: { id: req.user.id, role: req.user.role?.name },
    });
  }
);

// Finance Admin Module Route
router.get(
  '/finance',
  authenticateToken,
  requirePermission('payments.read', 'payments.view'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Access granted to Finance module.',
      user: { id: req.user.id, role: req.user.role?.name },
    });
  }
);

// Events Admin Module Route
router.get(
  '/events',
  authenticateToken,
  requirePermission('events.read', 'events.view'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Access granted to Events module.',
      user: { id: req.user.id, role: req.user.role?.name },
    });
  }
);

// Communications Admin Module Route
router.get(
  '/communications',
  authenticateToken,
  requirePermission('communications.read', 'communications.view'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Access granted to Communications module.',
      user: { id: req.user.id, role: req.user.role?.name },
    });
  }
);

// Users Management Route (Admin User Admin)
router.get(
  '/users-manage',
  authenticateToken,
  requirePermission('users.manage'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Access granted to User Management module.',
      user: { id: req.user.id, role: req.user.role?.name },
    });
  }
);

module.exports = router;
