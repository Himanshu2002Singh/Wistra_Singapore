'use strict';

/**
 * Centralized Express Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Unhandled error:', err);

  // Sequelize Unique Constraint Error
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: err.errors && err.errors.length > 0 ? err.errors[0].message : 'Duplicate field value enterred',
    });
  }

  // Sequelize Database Error
  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      success: false,
      message: 'A database error occurred.',
    });
  }

  // Default Error Response
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
