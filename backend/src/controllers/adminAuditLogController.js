'use strict';

const { Op, col, fn, where } = require('sequelize');
const { AuditLog, User, Role } = require('../models');

const MAX_PAGE_SIZE = 100;
const LOG_ATTRIBUTES = ['id', 'user_id', 'action', 'module', 'entity_type', 'entity_id', 'created_at'];
const ACTOR_ATTRIBUTES = ['id', 'first_name', 'last_name'];

const parsePositiveInteger = (value, fallback) => {
  if (value === undefined || value === '') return { value: fallback };
  if (!/^\d+$/.test(String(value))) return { error: true };
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? { value: parsed } : { error: true };
};

const parseDate = (value) => {
  if (value === undefined || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : false;
};

const getAdminAuditLogs = async (req, res, next) => {
  try {
    const pageResult = parsePositiveInteger(req.query.page, 1);
    const limitResult = parsePositiveInteger(req.query.limit, 20);
    if (pageResult.error || limitResult.error || limitResult.value > MAX_PAGE_SIZE) {
      return res.status(400).json({ success: false, message: `Page must be a positive integer and limit must be 1-${MAX_PAGE_SIZE}.` });
    }

    const search = req.query.search === undefined ? '' : req.query.search;
    if (typeof search !== 'string' || search.trim().length > 100) {
      return res.status(400).json({ success: false, message: 'Search must be text of at most 100 characters.' });
    }

    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);
    if (from === false || to === false) {
      return res.status(400).json({ success: false, message: 'Dates must use YYYY-MM-DD and be valid calendar dates.' });
    }
    if (from && to && from > to) {
      return res.status(400).json({ success: false, message: 'The start date must be on or before the end date.' });
    }

    const whereClause = {};
    for (const key of ['module', 'action']) {
      const value = req.query[key];
      if (value !== undefined && value !== '') {
        if (typeof value !== 'string' || value.length > 100) {
          return res.status(400).json({ success: false, message: `${key} filter is invalid.` });
        }
        whereClause[key] = value;
      }
    }
    if (from || to) {
      whereClause.created_at = {};
      if (from) whereClause.created_at[Op.gte] = from;
      if (to) {
        const endExclusive = new Date(to);
        endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
        whereClause.created_at[Op.lt] = endExclusive;
      }
    }

    const trimmedSearch = search.trim();
    if (trimmedSearch) {
      const pattern = `%${trimmedSearch}%`;
      whereClause[Op.or] = [
        { action: { [Op.like]: pattern } },
        { module: { [Op.like]: pattern } },
        { entity_type: { [Op.like]: pattern } },
        { entity_id: { [Op.like]: pattern } },
        where(fn('CONCAT_WS', ' ', col('user.first_name'), col('user.last_name')), { [Op.like]: pattern }),
      ];
    }

    const page = pageResult.value;
    const limit = limitResult.value;
    const offset = (page - 1) * limit;
    if (!Number.isSafeInteger(offset)) {
      return res.status(400).json({ success: false, message: 'Page is too large.' });
    }
    const { count, rows } = await AuditLog.findAndCountAll({
      attributes: LOG_ATTRIBUTES,
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ACTOR_ATTRIBUTES,
        required: false,
        include: [{ model: Role, as: 'role', attributes: ['id', 'name'], required: false }],
      }],
      order: [['created_at', 'DESC'], ['id', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    const [modules, actions] = await Promise.all([
      AuditLog.findAll({ attributes: ['module'], group: ['module'], raw: true, order: [['module', 'ASC']] }),
      AuditLog.findAll({ attributes: ['action'], group: ['action'], raw: true, order: [['action', 'ASC']] }),
    ]);

    return res.json({
      success: true,
      data: {
        logs: rows,
        total: count,
        page,
        pageSize: limit,
        totalPages: Math.max(Math.ceil(count / limit), 1),
        filters: {
          modules: modules.map((item) => item.module).filter(Boolean),
          actions: actions.map((item) => item.action).filter(Boolean),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getAdminAuditLogById = async (req, res, next) => {
  try {
    const id = String(req.params.id || '');
    if (!/^\d+$/.test(id) || !/[1-9]/.test(id) || id.length > 20 || BigInt(id) > 18446744073709551615n) {
      return res.status(404).json({ success: false, message: 'Audit log not found.' });
    }

    const log = await AuditLog.findByPk(id, {
      attributes: LOG_ATTRIBUTES,
      include: [{
        model: User,
        as: 'user',
        attributes: ACTOR_ATTRIBUTES,
        required: false,
        include: [{ model: Role, as: 'role', attributes: ['id', 'name'], required: false }],
      }],
    });
    if (!log) return res.status(404).json({ success: false, message: 'Audit log not found.' });

    return res.json({ success: true, data: log });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getAdminAuditLogs, getAdminAuditLogById };
