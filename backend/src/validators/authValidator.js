'use strict';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate registration request body.
 * @param {object} body
 * @returns {{ isValid: boolean, errors: object, normalizedData?: object }}
 */
const validateRegister = (body) => {
  const errors = {};
  const { email, password, first_name, last_name, phone } = body || {};

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Please provide a valid email address.';
  } else if (email.trim().length > 255) {
    errors.email = 'Email address cannot exceed 255 characters.';
  }

  if (!password || typeof password !== 'string') {
    errors.password = 'Password is required.';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters long.';
  }

  if (!first_name || typeof first_name !== 'string' || !first_name.trim()) {
    errors.first_name = 'First name is required.';
  } else if (first_name.trim().length > 100) {
    errors.first_name = 'First name cannot exceed 100 characters.';
  }

  if (!last_name || typeof last_name !== 'string' || !last_name.trim()) {
    errors.last_name = 'Last name is required.';
  } else if (last_name.trim().length > 100) {
    errors.last_name = 'Last name cannot exceed 100 characters.';
  }

  if (phone !== undefined && phone !== null && typeof phone !== 'string') {
    errors.phone = 'Phone number must be text.';
  } else if (typeof phone === 'string' && phone.trim().length > 20) {
    errors.phone = 'Phone number cannot exceed 20 characters.';
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    normalizedData: isValid
      ? {
          email: email.trim().toLowerCase(),
          password,
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          phone: phone && typeof phone === 'string' ? phone.trim() : null,
        }
      : null,
  };
};

/**
 * Validate login request body.
 * @param {object} body
 * @returns {{ isValid: boolean, errors: object, normalizedData?: object }}
 */
const validateLogin = (body) => {
  const errors = {};
  const { email, password } = body || {};

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.email = 'Email address is required.';
  }

  if (!password || typeof password !== 'string') {
    errors.password = 'Password is required.';
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    normalizedData: isValid
      ? {
          email: email.trim().toLowerCase(),
          password,
        }
      : null,
  };
};

module.exports = {
  validateRegister,
  validateLogin,
};
