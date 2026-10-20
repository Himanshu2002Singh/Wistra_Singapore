'use strict';

const { ContactMessage } = require('../models');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sanitizeText = (value) => value.replace(/\u0000/g, '').replace(/\r\n?/g, '\n').trim();

const submitContactMessage = async (req, res, next) => {
  try {
    const body = req.body || {};
    const allowedFields = new Set(['name', 'email', 'message']);
    if (Object.keys(body).some((field) => !allowedFields.has(field))) {
      return res.status(400).json({ success: false, message: 'Only name, email, and message are accepted.' });
    }

    const errors = {};
    if (typeof body.name !== 'string' || !sanitizeText(body.name) || sanitizeText(body.name).length > 100) {
      errors.name = 'Name is required and must be at most 100 characters.';
    }
    if (typeof body.email !== 'string' || !sanitizeText(body.email) || sanitizeText(body.email).length > 255 || !EMAIL_PATTERN.test(sanitizeText(body.email))) {
      errors.email = 'Enter a valid email address of at most 255 characters.';
    }
    if (typeof body.message !== 'string' || !sanitizeText(body.message) || sanitizeText(body.message).length > 5000) {
      errors.message = 'Message is required and must be at most 5000 characters.';
    }
    if (Object.keys(errors).length) {
      return res.status(400).json({ success: false, message: 'Please correct the highlighted fields.', errors });
    }

    const record = await ContactMessage.create({
      name: sanitizeText(body.name),
      email: sanitizeText(body.email).toLowerCase(),
      message: sanitizeText(body.message),
    });

    return res.status(201).json({
      success: true,
      message: 'Your message has been recorded. No email was sent; email notifications are not configured.',
      data: { id: record.id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitContactMessage };
