'use strict';

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticate');
const requirePermission = require('../middleware/requirePermission');
const requireRole = require('../middleware/requireRole');
const {
  getAdminUsers,
  getAdminUserById,
  getAdminRoles,
  getAdminPermissions,
  createAdminTeamMember,
  assignExistingUserRole,
} = require('../controllers/adminUserAccessController');

router.use(authenticateToken, requirePermission('users.view', 'users.read', 'users.manage'));

router.get('/roles', getAdminRoles);
router.get('/permissions', getAdminPermissions);
router.post('/create', requireRole('SUPER_ADMIN'), createAdminTeamMember);
router.post('/assign-role', requireRole('SUPER_ADMIN'), assignExistingUserRole);
router.get('/', getAdminUsers);
router.get('/:id', getAdminUserById);

module.exports = router;
