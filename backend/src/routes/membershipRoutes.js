'use strict';

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const {
  submitApplication,
  getMyApplications,
  getMyApplicationById,
} = require('../controllers/membershipApplicationController');

const { getMyMembership, updateMyProfile } = require('../controllers/memberPortalController');

// Applicant routes
router.post('/applications', authenticateToken, requireRole('MEMBER', { allowSuperAdmin: false }), submitApplication);
router.get('/applications/me', authenticateToken, requireRole('MEMBER', { allowSuperAdmin: false }), getMyApplications);
router.get('/applications/me/:id', authenticateToken, requireRole('MEMBER', { allowSuperAdmin: false }), getMyApplicationById);

// Member portal routes
router.get('/me', authenticateToken, requireRole('MEMBER', { allowSuperAdmin: false }), getMyMembership);
router.patch('/profile', authenticateToken, requireRole('MEMBER', { allowSuperAdmin: false }), updateMyProfile);

module.exports = router;
