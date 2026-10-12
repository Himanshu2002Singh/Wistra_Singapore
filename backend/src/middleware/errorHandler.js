'use strict';

/**
 * Centralized Express Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  // Do not dump Sequelize error objects: they may contain SQL parameters or user data.
  console.error('Unhandled request error.', {
    name: err.name,
    code: err.original?.code || err.code,
    statusCode: err.statusCode || err.status || 500,
  });

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
