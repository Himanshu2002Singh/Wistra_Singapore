'use strict';

const { User, Role, Permission } = require('../models');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { validateRegister, validateLogin } = require('../validators/authValidator');

const isAdministrativeRole = (roleName) =>
  roleName === 'SUPER_ADMIN' || (typeof roleName === 'string' && roleName.endsWith('_ADMIN'));

const isAdministrativePermission = (permissionName) =>
  /^(applications|members|membership|memberships|payments|invoices|events|registrations|attendance|communications|news|campaigns|reports|audit_logs|users)\./.test(permissionName);

const getAdminRoles = async (req, res, next) => {
  try {
    const roles = await Role.findAll({
      include: [{
        model: Permission,
        as: 'permissions',
        attributes: ['name'],
        through: { attributes: [] },
      }],
      order: [['name', 'ASC']],
    });

    const availableRoles = roles
      .filter((role) => isAdministrativeRole(role.name))
      .filter((role) => role.name === 'SUPER_ADMIN' || role.permissions.some(({ name }) => isAdministrativePermission(name)))
      .map(({ name, description }) => ({ name, description }));

    return res.json({ success: true, data: { roles: availableRoles } });
  } catch (error) {
    next(error);
  }
};

/**
 * Register a new platform user.
 * Public registration assigns default 'MEMBER' role and prevents admin role escalation.
 */
const register = async (req, res, next) => {
  try {
    const { isValid, errors, normalizedData } = validateRegister(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    const { email, password, first_name, last_name, phone } = normalizedData;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email address is already registered.',
      });
    }

    // Role escalation protection: locate default MEMBER role
    const memberRole = await Role.findOne({ where: { name: 'MEMBER' } });
    if (!memberRole) {
      return res.status(503).json({
        success: false,
        message: 'Registration is temporarily unavailable. Please contact WISTA support.',
      });
    }
    const roleId = memberRole.id;

    // Hash password with bcrypt
    const password_hash = await hashPassword(password);

    // Create user record
    let user;
    try {
      user = await User.create({
        email,
        password_hash,
        first_name,
        last_name,
        phone,
        role_id: roleId,
        status: 'ACTIVE',
      });
    } catch (error) {
      // The database unique constraint remains authoritative if two registrations race.
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          message: 'Email address is already registered.',
        });
      }
      throw error;
    }

    // Fetch newly created user with Role association for clean response
    const createdUser = await User.findByPk(user.id, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description'],
          include: [
            {
              model: Permission,
              as: 'permissions',
              attributes: ['id', 'name', 'description'],
              through: { attributes: [] },
            },
          ],
        },
      ],
      attributes: { exclude: ['password_hash'] },
    });

    // Generate JWT access token for immediate session authentication
    const roleName = createdUser.role ? createdUser.role.name : 'MEMBER';
    const token = generateToken({
      sub: createdUser.id,
      role: roleName,
    });
    const safeUser = createdUser.toJSON();
    safeUser.permissions = createdUser.role?.permissions?.map((permission) => permission.name) || [];

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        token,
        user: safeUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Authenticate user and issue JWT token.
 */
const login = async (req, res, next) => {
  try {
    const requestedAdminRole = req.body?.admin_role;
    if (requestedAdminRole !== undefined && (typeof requestedAdminRole !== 'string' || !isAdministrativeRole(requestedAdminRole.trim()))) {
      return res.status(400).json({ success: false, message: 'Select a valid administrative role.' });
    }

    const { isValid, errors, normalizedData } = validateLogin(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    const { email, password } = normalizedData;

    // Locate user by email with Role association
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description'],
          include: [
            {
              model: Permission,
              as: 'permissions',
              attributes: ['id', 'name', 'description'],
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    // Security rule: generic error for non-existent user or invalid password
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check account status
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status.toLowerCase()}. Access denied.`,
      });
    }

    // Compare password with bcrypt
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const actualRole = user.role?.name;
    if (requestedAdminRole === undefined && isAdministrativeRole(actualRole)) {
      return res.status(403).json({
        success: false,
        message: 'Administrator accounts must sign in through the admin access gateway.',
      });
    }

    if (requestedAdminRole !== undefined) {
      const assignedPermissions = user.role?.permissions?.map(({ name }) => name) || [];
      const hasAdministrativePermission = actualRole === 'SUPER_ADMIN'
        || assignedPermissions.some(isAdministrativePermission);

      if (actualRole !== requestedAdminRole.trim() || !isAdministrativeRole(actualRole) || !hasAdministrativePermission) {
        return res.status(403).json({
          success: false,
          message: 'This account is not authorized for the selected administrative role.',
        });
      }
    }

    // Update last_login_at
    user.last_login_at = new Date();
    await user.save();

    // Generate JWT access token with minimal payload
    const roleName = user.role ? user.role.name : 'MEMBER';
    const token = generateToken({
      sub: user.id,
      role: roleName,
    });

    // Build sanitized user output
    const userJson = user.toJSON();
    delete userJson.password_hash;
    userJson.permissions = user.role?.permissions?.map((permission) => permission.name) || [];

    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: userJson,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch current authenticated user details.
 */
const getMe = async (req, res, next) => {
  try {
    return res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Stateless logout endpoint.
 */
const logout = async (req, res, next) => {
  try {
    return res.json({
      success: true,
      message: 'Logged out successfully. Please clear your access token.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminRoles,
  register,
  login,
  getMe,
  logout,
};
