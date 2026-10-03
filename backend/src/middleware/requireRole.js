'use strict';

/**
 * Authorization middleware to restrict route access by role.
 * @param {...(string|{allowSuperAdmin?: boolean})} allowedRoles
 */
const requireRole = (...roleArguments) => {
  const lastArgument = roleArguments[roleArguments.length - 1];
  const options = lastArgument && typeof lastArgument === 'object' ? lastArgument : null;
  const allowSuperAdmin = options?.allowSuperAdmin !== false;
  const allowedRoles = options ? roleArguments.slice(0, -1) : roleArguments;

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const userRole = req.user.role ? req.user.role.name : null;

    // SUPER_ADMIN has full administrative access across all role checks
    if (allowSuperAdmin && userRole === 'SUPER_ADMIN') {
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
