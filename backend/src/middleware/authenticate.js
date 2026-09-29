'use strict';

const { verifyToken } = require('../utils/jwt');
const { User, Role, Permission } = require('../models');

/**
 * Authentication middleware to verify JWT access token and attach user with role and permissions to request.
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization header format. Format must be: Bearer <token>',
      });
    }

    const token = parts[1];
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token',
      });
    }

    const userId = decoded.sub || decoded.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload',
      });
    }

    // Fetch user from database with Role and permissions
    const user = await User.findByPk(userId, {
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

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists',
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status.toLowerCase()}. Access denied.`,
      });
    }

    // Format user object with permissions array
    const userObj = user.toJSON();
    const permissionNames = user.role?.permissions?.map((p) => p.name) || [];
    userObj.permissions = permissionNames;

    req.user = userObj;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticateToken;
