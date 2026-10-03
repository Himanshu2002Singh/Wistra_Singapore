'use strict';

const { User, Role, Permission } = require('../models');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { validateRegister, validateLogin } = require('../validators/authValidator');

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
    const user = await User.create({
      email,
      password_hash,
      first_name,
      last_name,
      phone,
      role_id: roleId,
      status: 'ACTIVE',
    });

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
  register,
  login,
  getMe,
  logout,
};
