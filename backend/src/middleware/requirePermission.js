'use strict';

/**
 * Authorization middleware to restrict route access by database permission.
 * @param {...string} requiredPermissions
 */
const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const userRole = req.user.role ? req.user.role.name : null;

    // SUPER_ADMIN has implicit full access to all permissions
    if (userRole === 'SUPER_ADMIN') {
      return next();
    }

    const userPermissions = req.user.permissions || [];

    // Check if user possesses at least one of the required permissions
    const hasPermission = requiredPermissions.some((perm) => userPermissions.includes(perm));

    if (hasPermission) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'You do not have permission to perform this action.',
    });
  };
};

module.exports = requirePermission;
