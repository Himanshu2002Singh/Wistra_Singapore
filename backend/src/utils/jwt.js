'use strict';

const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }
  return secret;
};

const getJwtExpiresIn = () => {
  return process.env.JWT_EXPIRES_IN || '7d';
};

/**
 * Generate a JWT token for a payload.
 * @param {object} payload
 * @returns {string} token
 */
const generateToken = (payload) => {
  const secret = getJwtSecret();
  const expiresIn = getJwtExpiresIn();
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify and decode a JWT token.
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyToken = (token) => {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  verifyToken,
};
