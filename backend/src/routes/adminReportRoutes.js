'use strict';

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticate');
const requirePermission = require('../middleware/requirePermission');
const {
  getMembershipReport,
  exportMembershipReport,
  getApplicationsReport,
  exportApplicationsReport,
  getFinancialReport,
  exportFinancialReport,
} = require('../controllers/adminReportController');

const readReport = (...dataPermissions) => [
  authenticateToken,
  requirePermission('reports.read', 'reports.view'),
  requirePermission(...dataPermissions),
];

const exportReport = (...dataPermissions) => [
  authenticateToken,
  requirePermission('reports.export'),
  requirePermission(...dataPermissions),
];

const readFinancialReport = [
  ...readReport('payments.read'),
  requirePermission('invoices.read'),
];

const exportFinancialReportAccess = [
  ...exportReport('payments.read'),
  requirePermission('invoices.read'),
];

router.get('/membership', ...readReport('members.read', 'membership.read'), getMembershipReport);
router.get('/membership/export', ...exportReport('members.read', 'membership.read'), exportMembershipReport);

router.get('/applications', ...readReport('applications.read'), getApplicationsReport);
router.get('/applications/export', ...exportReport('applications.read'), exportApplicationsReport);

router.get('/financial', ...readFinancialReport, getFinancialReport);
router.get('/financial/export', ...exportFinancialReportAccess, exportFinancialReport);

module.exports = router;
