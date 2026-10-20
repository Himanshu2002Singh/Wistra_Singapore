'use strict';

const crypto = require('node:crypto');
const { Op } = require('sequelize');
const { sequelize, User, PasswordResetToken, AuditLog } = require('../models');
const { hashPassword } = require('../utils/password');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_TTL_MS = 30 * 60 * 1000;
const RESET_REQUEST_MESSAGE = 'If this address belongs to an active account, a reset request has been recorded. Password-reset email delivery is not configured; contact WISTA Singapore support to complete the reset.';
const INVALID_TOKEN_MESSAGE = 'This reset token is invalid or expired. Request a new password reset.';
const sha256 = (value) => crypto.createHash('sha256').update(value, 'utf8').digest('hex');

const requestPasswordReset = async (req, res, next) => {
  try {
    const body = req.body || {};
    const extraFields = Object.keys(body).filter((field) => field !== 'email');
    if (extraFields.length) return res.status(400).json({ success: false, message: 'Only an email address is accepted.' });
    if (typeof body.email !== 'string' || body.email.trim().length > 255 || !EMAIL_PATTERN.test(body.email.trim())) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
    }

    const user = await User.findOne({
      where: { email: body.email.trim().toLowerCase(), status: 'ACTIVE' },
      attributes: ['id'],
    });
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('base64url');
      const now = new Date();
      const transaction = await sequelize.transaction();
      try {
        const activeUser = await User.findOne({
          where: { id: user.id, status: 'ACTIVE' },
          attributes: ['id'],
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!activeUser) {
          await transaction.rollback();
          return res.status(202).json({ success: true, message: RESET_REQUEST_MESSAGE });
        }
        await PasswordResetToken.update(
          { used_at: now },
          { where: { user_id: user.id, used_at: null }, transaction }
        );
        await PasswordResetToken.create({
          user_id: user.id,
          token_hash: sha256(rawToken),
          expires_at: new Date(now.getTime() + TOKEN_TTL_MS),
        }, { transaction });
        await transaction.commit();
      } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
      }
      // Intentionally discard the raw token. No email transport is configured to deliver it.
    }

    return res.status(202).json({ success: true, message: RESET_REQUEST_MESSAGE });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  let transaction;
  try {
    const body = req.body || {};
    const extraFields = Object.keys(body).filter((field) => !['token', 'password'].includes(field));
    if (extraFields.length) return res.status(400).json({ success: false, message: 'Only a reset token and new password are accepted.' });

    if (typeof body.token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(body.token)) {
      return res.status(400).json({ success: false, message: INVALID_TOKEN_MESSAGE });
    }
    if (typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 128) {
      return res.status(400).json({ success: false, message: 'Password must be between 8 and 128 characters.' });
    }

    transaction = await sequelize.transaction();
    const tokenCandidate = await PasswordResetToken.findOne({
      where: { token_hash: sha256(body.token) },
      attributes: ['id', 'user_id'],
      transaction,
    });
    if (!tokenCandidate) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: INVALID_TOKEN_MESSAGE });
    }

    const user = await User.findOne({
      where: { id: tokenCandidate.user_id, status: 'ACTIVE' },
      attributes: ['id', 'token_version'],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!user) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: INVALID_TOKEN_MESSAGE });
    }

    const tokenRecord = await PasswordResetToken.findOne({
      where: {
        id: tokenCandidate.id,
        token_hash: sha256(body.token),
        used_at: null,
        expires_at: { [Op.gt]: new Date() },
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!tokenRecord) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: INVALID_TOKEN_MESSAGE });
    }

    const password_hash = await hashPassword(body.password);
    await User.update({ password_hash, token_version: Number(user.token_version || 0) + 1 }, { where: { id: user.id }, transaction });
    tokenRecord.used_at = new Date();
    await tokenRecord.save({ transaction });
    await PasswordResetToken.update(
      { used_at: new Date() },
      { where: { user_id: tokenRecord.user_id, id: { [Op.ne]: tokenRecord.id }, used_at: null }, transaction }
    );
    await AuditLog.create({
      user_id: user.id,
      action: 'PASSWORD_RESET_COMPLETED',
      module: 'AUTH',
      entity_type: 'User',
      entity_id: String(user.id),
      ip_address: req.ip,
      user_agent: String(req.get('user-agent') || '').slice(0, 500),
    }, { transaction });
    await transaction.commit();
    return res.json({ success: true, message: 'Password updated. You can now sign in with your new password.' });
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    next(error);
  }
};

module.exports = { requestPasswordReset, resetPassword, sha256 };
