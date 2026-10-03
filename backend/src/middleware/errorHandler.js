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
      message: 'A record with these details already exists.',
    });
  }

  if (err.name?.startsWith('Sequelize')) {
    return res.status(500).json({
      success: false,
      message: 'A database request could not be completed.',
    });
  }

  // Default Error Response
  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode >= 500
    ? 'The server could not complete the request. Please try again later.'
    : (err.message || 'The request could not be completed.');

  return res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
