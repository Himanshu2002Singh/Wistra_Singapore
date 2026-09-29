'use strict';

/**
 * Authorization middleware to restrict route access by role.
 * @param {...string} allowedRoles
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const userRole = req.user.role ? req.user.role.name : null;

    // SUPER_ADMIN has full administrative access across all role checks
    if (userRole === 'SUPER_ADMIN') {
      return next();
    }

    if (userRole && allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'You do not have permission to perform this action.',
    });
  };
};

module.exports = requireRole;
