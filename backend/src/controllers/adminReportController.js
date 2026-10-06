'use strict';

const { fn, col, Op } = require('sequelize');
const { Membership, MembershipApplication, Payment, Invoice, AuditLog } = require('../models');

const normalizeCount = (value) => Number(value) || 0;
const normalizeAmount = (value) => value === null || value === undefined ? '0.00' : String(value);

const parseFilters = (query) => {
  if ((query.from !== undefined && typeof query.from !== 'string') || (query.to !== undefined && typeof query.to !== 'string')) {
    return { error: 'Dates must be supplied as single YYYY-MM-DD values.' };
  }
  const from = typeof query.from === 'string' ? query.from.trim() : '';
  const to = typeof query.to === 'string' ? query.to.trim() : '';
  const validDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };

  if (Boolean(from) !== Boolean(to)) {
    return { error: 'Provide both from and to dates, or leave both empty.' };
  }
  if (from && (!validDate(from) || !validDate(to))) {
    return { error: 'Dates must be valid calendar dates in YYYY-MM-DD format.' };
  }
  if (from && from > to) return { error: 'The from date must be on or before the to date.' };

  return { from: from || null, to: to || null };
};

const dateWhere = (Model, filters) => {
  if (!filters.from) return {};
  const createdAtField = Model.rawAttributes.created_at ? 'created_at' : 'createdAt';
  return {
    [createdAtField]: {
      [Op.gte]: new Date(`${filters.from}T00:00:00.000Z`),
      [Op.lte]: new Date(`${filters.to}T23:59:59.999Z`),
    },
  };
};

const groupCounts = async (Model, field, filters) => {
  const rows = await Model.findAll({
    attributes: [field, [fn('COUNT', col('id')), 'count']],
    where: dateWhere(Model, filters),
    group: [field],
    raw: true,
  });
  return rows.map((row) => ({ [field]: row[field], count: normalizeCount(row.count) }));
};

const groupFinancialValues = async (Model, statusField, amountField, filters) => {
  const rows = await Model.findAll({
    attributes: [
      statusField,
      'currency',
      [fn('COUNT', col('id')), 'count'],
      [fn('SUM', col(amountField)), 'amount_total'],
    ],
    where: dateWhere(Model, filters),
    group: [statusField, 'currency'],
    raw: true,
  });
  return rows.map((row) => ({
    status: row[statusField],
    currency: row.currency,
    count: normalizeCount(row.count),
    amount_total: normalizeAmount(row.amount_total),
  }));
};

const getMembershipReport = async (filters) => {
  const [byStatus, byType] = await Promise.all([
    groupCounts(Membership, 'status', filters),
    groupCounts(Membership, 'membership_type', filters),
  ]);
  return {
    total: byStatus.reduce((sum, item) => sum + item.count, 0),
    byStatus,
    byType,
  };
};

const getApplicationsReport = async (filters) => {
  const [byStatus, byType] = await Promise.all([
    groupCounts(MembershipApplication, 'status', filters),
    groupCounts(MembershipApplication, 'membership_type', filters),
  ]);
  return {
    total: byStatus.reduce((sum, item) => sum + item.count, 0),
    byStatus,
    byType,
  };
};

const getFinancialReport = async (filters) => {
  const [payments, invoices] = await Promise.all([
    groupFinancialValues(Payment, 'payment_status', 'amount', filters),
    groupFinancialValues(Invoice, 'status', 'total', filters),
  ]);
  return {
    payments: {
      total: payments.reduce((sum, item) => sum + item.count, 0),
      byStatus: payments,
    },
    invoices: {
      total: invoices.reduce((sum, item) => sum + item.count, 0),
      byStatus: invoices,
    },
  };
};

const csvCell = (value, protectFormula = true) => {
  const text = String(value ?? '');
  const safeText = protectFormula && /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
};

const reportCsvRows = (type, data) => {
  if (type === 'membership' || type === 'applications') {
    const label = type === 'membership' ? 'Memberships' : 'Applications';
    return [
      [label, 'All statuses', '', data.total, '', ''],
      ...data.byStatus.map((row) => [label, row.status, '', row.count, '', '']),
      ...data.byType.map((row) => [label, '', row.membership_type, row.count, '', '']),
    ];
  }
  return [
    ...data.payments.byStatus.map((row) => ['Payments', row.status, '', row.count, row.amount_total, row.currency]),
    ...data.invoices.byStatus.map((row) => ['Invoices', row.status, '', row.count, row.amount_total, row.currency]),
  ];
};

const sendCsv = (type, data, filters, res) => {
  const header = ['Record type', 'Status', 'Membership type', 'Count', 'Amount total', 'Currency', 'From date', 'To date'];
  const rows = reportCsvRows(type, data).map((row) => [...row, filters.from || '', filters.to || '']);
  const lines = [header, ...rows].map((row) => row.map((value, index) => csvCell(value, [0, 1, 2, 5, 6, 7].includes(index))).join(','));
  const csv = `\uFEFF${lines.join('\r\n')}\r\n`;
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', `attachment; filename="${type}-report.csv"`);
  res.send(csv);
};

const reportLoaders = {
  membership: getMembershipReport,
  applications: getApplicationsReport,
  financial: getFinancialReport,
};

const recordReportAudit = (req, type, action, filters, format = 'json') => AuditLog.create({
  user_id: req.user.id,
  action,
  module: 'REPORTS',
  entity_type: 'Report',
  entity_id: type,
  new_values: { from: filters.from, to: filters.to, format },
  ip_address: req.ip,
  user_agent: req.get('User-Agent'),
});

const deliverReport = (type, exportCsv = false) => async (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    if (filters.error) return res.status(400).json({ success: false, message: filters.error });

    const data = await reportLoaders[type](filters);
    if (exportCsv) {
      await recordReportAudit(req, type, 'REPORT_EXPORTED', filters, 'csv');
      return sendCsv(type, data, filters, res);
    }

    await recordReportAudit(req, type, 'REPORT_VIEWED', filters);
    return res.json({ success: true, data: { report: type, filters: { from: filters.from, to: filters.to }, ...data } });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMembershipReport: deliverReport('membership'),
  exportMembershipReport: deliverReport('membership', true),
  getApplicationsReport: deliverReport('applications'),
  exportApplicationsReport: deliverReport('applications', true),
  getFinancialReport: deliverReport('financial'),
  exportFinancialReport: deliverReport('financial', true),
};
