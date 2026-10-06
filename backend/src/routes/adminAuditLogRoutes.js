'use strict';

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticate');
const requirePermission = require('../middleware/requirePermission');
const { getAdminAuditLogs, getAdminAuditLogById } = require('../controllers/adminAuditLogController');

router.use(authenticateToken, requirePermission('audit_logs.read', 'audit_logs.view'));

router.get('/', getAdminAuditLogs);
router.get('/:id', getAdminAuditLogById);

module.exports = router;
