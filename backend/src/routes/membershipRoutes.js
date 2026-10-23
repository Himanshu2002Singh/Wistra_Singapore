'use strict';

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const {
  submitApplication,
  getMyApplications,
  getMyApplicationById,
  resubmitApplicationClarification,
} = require('../controllers/membershipApplicationController');

const { getMyActivity, getMyMembership, updateMyProfile } = require('../controllers/memberPortalController');
const { listMemberDirectory } = require('../controllers/memberDirectoryController');
const requirePermission = require('../middleware/requirePermission');
const { studentApplicationUpload } = require('../middleware/studentApplicationUpload');
const { submitStudentApplication, resubmitStudentApplicationClarification, getMyStudentApplication } = require('../controllers/studentApplicationController');
const { listMyEventRegistrations, registerForEvent } = require('../controllers/eventRegistrationController');

// Applicant routes
router.get('/applications/student', authenticateToken, requireRole('MEMBER', { allowSuperAdmin: false }), getMyStudentApplication);
router.post('/applications/student', authenticateToken, requireRole('MEMBER', { allowSuperAdmin: false }), studentApplicationUpload, submitStudentApplication);
router.post('/applications', authenticateToken, requireRole('MEMBER', { allowSuperAdmin: false }), submitApplication);
router.get('/applications/me', authenticateToken, requireRole('MEMBER', { allowSuperAdmin: false }), getMyApplications);
router.get('/applications/me/:id', authenticateToken, requireRole('MEMBER', { allowSuperAdmin: false }), getMyApplicationById);
router.patch('/applications/me/:id/clarification', authenticateToken, requireRole('MEMBER', { allowSuperAdmin: false }), resubmitApplicationClarification);
router.patch('/applications/student/:id/clarification', authenticateToken, requireRole('MEMBER', { allowSuperAdmin: false }), studentApplicationUpload, resubmitStudentApplicationClarification);
router.get('/events/registrations/me', authenticateToken, requireRole('MEMBER', { allowSuperAdmin: false }), listMyEventRegistrations);
router.post('/events/:eventId/registrations', authenticateToken, requireRole('MEMBER', { allowSuperAdmin: false }), registerForEvent);

// Member portal routes
router.get('/directory', authenticateToken, requirePermission('directory.read', 'directory.view'), listMemberDirectory);
router.get('/activity/me', authenticateToken, requireRole('MEMBER', { allowSuperAdmin: false }), getMyActivity);
router.get('/me', authenticateToken, requireRole('MEMBER', { allowSuperAdmin: false }), getMyMembership);
router.patch('/profile', authenticateToken, requireRole('MEMBER', { allowSuperAdmin: false }), updateMyProfile);

module.exports = router;
