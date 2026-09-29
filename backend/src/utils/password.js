'use strict';

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt.
 * @param {string} password
 * @returns {Promise<string>} password_hash
 */
const hashPassword = async (password) => {
  if (!password) {
    throw new Error('Password is required for hashing');
  }
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a plain text password against a stored hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
const comparePassword = async (password, hash) => {
  if (!password || !hash) {
    return false;
  }
  return await bcrypt.compare(password, hash);
};

module.exports = {
  hashPassword,
  comparePassword,
};
