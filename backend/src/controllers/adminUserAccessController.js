'use strict';

const { Op, fn, col, where } = require('sequelize');
const { sequelize, User, Role, Permission, AuditLog } = require('../models');
const { validateRegister } = require('../validators/authValidator');
const { hashPassword } = require('../utils/password');

const USER_ATTRIBUTES = ['id', 'first_name', 'last_name', 'email', 'status', 'role_id', 'created_at', 'updated_at'];
const ROLE_ATTRIBUTES = ['id', 'name', 'description', 'created_at', 'updated_at'];
const PERMISSION_ATTRIBUTES = ['id', 'name', 'description', 'created_at', 'updated_at'];
const ACCOUNT_STATUSES = User.rawAttributes.status.type.values;
const MAX_PAGE_SIZE = 50;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADMIN_PERMISSION_PREFIXES = ['applications', 'members', 'membership', 'memberships', 'payments', 'invoices', 'events', 'registrations', 'attendance', 'communications', 'news', 'campaigns', 'reports', 'audit_logs', 'users'];

const isAdministrativeRole = (role) => role?.name === 'SUPER_ADMIN' || (typeof role?.name === 'string' && role.name.endsWith('_ADMIN'));
const hasAdministrativePermission = (role) => role?.permissions?.some(({ name }) => ADMIN_PERMISSION_PREFIXES.some((prefix) => name.startsWith(`${prefix}.`)));

const createAdminTeamMember = async (req, res, next) => {
  const { isValid, errors, normalizedData } = validateRegister(req.body);
  if (!isValid) return res.status(400).json({ success: false, message: 'Validation failed.', errors });

  const roleIdResult = parsePositiveInteger(req.body?.role_id);
  if (roleIdResult.error || !roleIdResult.value) {
    return res.status(400).json({ success: false, message: 'Select a valid administrative role.' });
  }

  const transaction = await sequelize.transaction();
  try {
    const role = await Role.findByPk(roleIdResult.value, {
      include: [{ model: Permission, as: 'permissions', attributes: ['name'], through: { attributes: [] } }],
      transaction,
    });
    if (!isAdministrativeRole(role) || (role.name !== 'SUPER_ADMIN' && !hasAdministrativePermission(role))) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Select an existing administrative role.' });
    }

    const existingUser = await User.findOne({ where: { email: normalizedData.email }, attributes: ['id'], transaction, lock: transaction.LOCK.UPDATE });
    if (existingUser) {
      await transaction.rollback();
      return res.status(409).json({ success: false, code: 'EMAIL_ALREADY_REGISTERED', message: 'An account with this email already exists. Use the existing-account option; its password was not changed.' });
    }

    const password_hash = await hashPassword(normalizedData.password);
    const createdUser = await User.create({
      email: normalizedData.email,
      password_hash,
      first_name: normalizedData.first_name,
      last_name: normalizedData.last_name,
      phone: normalizedData.phone,
      role_id: role.id,
      status: 'ACTIVE',
    }, { transaction });
    await AuditLog.create({
      user_id: req.user.id,
      action: 'ADMIN_TEAM_MEMBER_CREATED',
      module: 'USERS',
      entity_type: 'User',
      entity_id: String(createdUser.id),
      old_values: null,
      new_values: { email: normalizedData.email, role_id: role.id, role: role.name },
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    }, { transaction });
    await transaction.commit();

    const safeUser = await User.findByPk(createdUser.id, {
      attributes: USER_ATTRIBUTES,
      include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'description'], required: false }],
    });
    return res.status(201).json({ success: true, message: 'Team member account created and role assigned.', data: safeUser });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, code: 'EMAIL_ALREADY_REGISTERED', message: 'An account with this email already exists. Use the existing-account option; its password was not changed.' });
    }
    return next(error);
  }
};

const parsePositiveInteger = (value, fallback) => {
  if (value === undefined || value === '') return { value: fallback };
  if (!/^\d+$/.test(String(value))) return { error: true };
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? { value: parsed } : { error: true };
};

const getAdminUsers = async (req, res, next) => {
  try {
    const pageResult = parsePositiveInteger(req.query.page, 1);
    const limitResult = parsePositiveInteger(req.query.limit, 10);
    if (pageResult.error || limitResult.error) {
      return res.status(400).json({ success: false, message: 'Page and limit must be positive integers.' });
    }
    if (limitResult.value > MAX_PAGE_SIZE) {
      return res.status(400).json({ success: false, message: `Limit cannot exceed ${MAX_PAGE_SIZE}.` });
    }

    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    if (req.query.search !== undefined && typeof req.query.search !== 'string') {
      return res.status(400).json({ success: false, message: 'Search must be a single text value.' });
    }
    if (search.length > 100) {
      return res.status(400).json({ success: false, message: 'Search cannot exceed 100 characters.' });
    }

    const whereClause = {};
    if (req.query.status) {
      if (typeof req.query.status !== 'string' || !ACCOUNT_STATUSES.includes(req.query.status)) {
        return res.status(400).json({ success: false, message: 'Status is not supported.' });
      }
      whereClause.status = req.query.status;
    }

    if (req.query.role_id !== undefined && req.query.role_id !== '') {
      const roleId = parsePositiveInteger(req.query.role_id);
      if (roleId.error) return res.status(400).json({ success: false, message: 'Role filter must be a valid role ID.' });
      whereClause.role_id = roleId.value;
    }

    if (search) {
      const pattern = `%${search}%`;
      whereClause[Op.or] = [
        { first_name: { [Op.like]: pattern } },
        { last_name: { [Op.like]: pattern } },
        { email: { [Op.like]: pattern } },
        where(fn('CONCAT_WS', ' ', col('first_name'), col('last_name')), { [Op.like]: pattern }),
      ];
    }

    if (req.query.team_only !== undefined && !['true', 'false'].includes(req.query.team_only)) {
      return res.status(400).json({ success: false, message: 'Team filter must be true or false.' });
    }
    if (req.query.team_only === 'true') {
      const roles = await Role.findAll({
        attributes: ['id', 'name'],
        include: [{ model: Permission, as: 'permissions', attributes: ['name'], through: { attributes: [] } }],
      });
      const teamRoleIds = roles
        .filter((role) => isAdministrativeRole(role) && (role.name === 'SUPER_ADMIN' || hasAdministrativePermission(role)))
        .map((role) => Number(role.id));
      const selectedRoleId = whereClause.role_id;
      if (selectedRoleId !== undefined) {
        if (!teamRoleIds.includes(selectedRoleId)) whereClause.role_id = { [Op.in]: [] };
      } else {
        whereClause.role_id = { [Op.in]: teamRoleIds };
      }
    }

    const page = pageResult.value;
    const limit = limitResult.value;
    const { count, rows } = await User.findAndCountAll({
      attributes: USER_ATTRIBUTES,
      where: whereClause,
      include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'description'], required: false }],
      order: [['created_at', 'DESC'], ['id', 'DESC']],
      limit,
      offset: (page - 1) * limit,
      distinct: true,
    });

    return res.json({
      success: true,
      data: {
        users: rows,
        total: count,
        page,
        pageSize: limit,
        totalPages: Math.max(Math.ceil(count / limit), 1),
        statuses: ACCOUNT_STATUSES,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const assignExistingUserRole = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const roleIdResult = parsePositiveInteger(req.body?.role_id);
    if (!email || email.length > 255 || !EMAIL_REGEX.test(email)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
    }
    if (roleIdResult.error || !roleIdResult.value) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Select a valid administrative role.' });
    }
    const roleId = roleIdResult.value

    const role = await Role.findByPk(roleId, {
      include: [{ model: Permission, as: 'permissions', attributes: ['name'], through: { attributes: [] } }],
      transaction,
    });
    if (!isAdministrativeRole(role) || (role.name !== 'SUPER_ADMIN' && !hasAdministrativePermission(role))) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Select an existing administrative role.' });
    }

    const user = await User.findOne({
      where: { email },
      attributes: ['id', 'first_name', 'last_name', 'email', 'status', 'role_id'],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'No account exists for this email. The person must register before being added to the admin team.' });
    }
    if (Number(user.id) === Number(req.user.id) && Number(user.role_id) !== roleId) {
      await transaction.rollback();
      return res.status(409).json({ success: false, message: 'You cannot change your own administrative role.' });
    }
    if (Number(user.role_id) === roleId) {
      await transaction.rollback();
      return res.status(409).json({ success: false, message: 'This account already has the selected role.' });
    }

    const previousRole = user.role_id ? await Role.findByPk(user.role_id, { transaction }) : null;
    user.role_id = role.id;
    await user.save({ transaction });
    await AuditLog.create({
      user_id: req.user.id,
      action: 'ADMIN_ROLE_ASSIGNED',
      module: 'USERS',
      entity_type: 'User',
      entity_id: String(user.id),
      old_values: { role_id: previousRole?.id || null, role: previousRole?.name || null },
      new_values: { role_id: role.id, role: role.name },
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    }, { transaction });
    await transaction.commit();

    const updatedUser = await User.findByPk(user.id, {
      attributes: USER_ATTRIBUTES,
      include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'description'], required: false }],
    });
    return res.json({ success: true, message: 'Existing account added to the admin team.', data: updatedUser });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'This account already has the selected role.' });
    }
    return next(error);
  }
};

const getAdminUserById = async (req, res, next) => {
  try {
    const userId = parsePositiveInteger(req.params.id);
    if (userId.error) return res.status(404).json({ success: false, message: 'User not found.' });

    const user = await User.findByPk(userId.value, {
      attributes: USER_ATTRIBUTES,
      include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'description'], required: false }],
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, data: user });
  } catch (error) {
    return next(error);
  }
};

const getAdminRoles = async (_req, res, next) => {
  try {
    const roles = await Role.findAll({
      attributes: ROLE_ATTRIBUTES,
      include: [{
        model: Permission,
        as: 'permissions',
        attributes: ['id', 'name', 'description'],
        through: { attributes: [] },
        required: false,
      }],
      order: [['name', 'ASC'], [{ model: Permission, as: 'permissions' }, 'name', 'ASC']],
    });
    return res.json({ success: true, data: roles });
  } catch (error) {
    return next(error);
  }
};

const getAdminPermissions = async (_req, res, next) => {
  try {
    const permissions = await Permission.findAll({
      attributes: PERMISSION_ATTRIBUTES,
      include: [{
        model: Role,
        as: 'roles',
        attributes: ['id', 'name', 'description'],
        through: { attributes: [] },
        required: false,
      }],
      order: [['name', 'ASC'], [{ model: Role, as: 'roles' }, 'name', 'ASC']],
    });
    return res.json({ success: true, data: permissions });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAdminUsers,
  getAdminUserById,
  getAdminRoles,
  getAdminPermissions,
  createAdminTeamMember,
  assignExistingUserRole,
};
