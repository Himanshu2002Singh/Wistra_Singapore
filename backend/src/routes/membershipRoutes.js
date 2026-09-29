'use strict';

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticate');
const {
  submitApplication,
  getMyApplications,
  getMyApplicationById,
} = require('../controllers/membershipApplicationController');

const { getMyMembership } = require('../controllers/memberPortalController');

// Applicant routes
router.post('/applications', authenticateToken, submitApplication);
router.get('/applications/me', authenticateToken, getMyApplications);
router.get('/applications/me/:id', authenticateToken, getMyApplicationById);

// Member portal routes
router.get('/me', authenticateToken, getMyMembership);

module.exports = router;
