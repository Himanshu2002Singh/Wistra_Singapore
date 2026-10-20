'use strict';

require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const app = require('../app');
const { sequelize, User, Role, ContactMessage, PasswordResetToken, AuditLog } = require('../models');
const { hashPassword } = require('./password');
const { generateToken } = require('./jwt');
const { sha256 } = require('../controllers/passwordResetController');

const createdUserIds = [];
const createdContactIds = [];
const createdResetTokenIds = [];
let server;

const request = async (baseUrl, endpoint, { method = 'POST', body, token } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}${endpoint}`, { method, headers, body: JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
};

const run = async () => {
  await sequelize.authenticate();
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  let cleanupVerified = false;
  const originalCreate = ContactMessage.create;

  try {
    const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const memberRole = await Role.findOne({ where: { name: 'MEMBER' } });
    assert.ok(memberRole, 'Requires existing MEMBER role');
    const email = `contact-reset-${unique}@example.invalid`;
    const originalPassword = `Original-${unique}!`;
    const user = await User.create({
      first_name: 'Contact', last_name: 'Reset Test', email,
      password_hash: await hashPassword(originalPassword), role_id: memberRole.id, status: 'ACTIVE',
    });
    createdUserIds.push(user.id);
    const memberToken = generateToken({ sub: user.id, role: 'MEMBER' });

    const invalidContact = await request(baseUrl, '/contact', { body: { name: ' ', email, message: '' } });
    assert.equal(invalidContact.status, 400, 'Contact form validates required fields');
    const unsupportedContactField = await request(baseUrl, '/contact', { body: { name: 'Test', email, message: 'Hello', html: '<script>' } });
    assert.equal(unsupportedContactField.status, 400, 'Contact form rejects unsupported input fields');

    const contactResponse = await request(baseUrl, '/contact', {
      body: { name: '  Directory\u0000 Contact  ', email: ` ${email.toUpperCase()} `, message: '  Please contact me.\r\nThanks.  ' },
    });
    assert.equal(contactResponse.status, 201, 'Contact endpoint confirms persistence only after create succeeds');
    assert.match(contactResponse.body.message, /No email was sent/i, 'Contact response does not claim email delivery');
    const contactId = contactResponse.body.data.id;
    createdContactIds.push(contactId);
    const persistedMessage = await ContactMessage.findByPk(contactId);
    assert.equal(persistedMessage.name, 'Directory Contact', 'Contact name is trimmed and sanitized');
    assert.equal(persistedMessage.email, email, 'Contact email is normalized');
    assert.equal(persistedMessage.message, 'Please contact me.\nThanks.', 'Contact message is normalized and persisted');

    ContactMessage.create = async () => { throw new Error('simulated database failure'); };
    const failedContact = await request(baseUrl, '/contact', { body: { name: 'Test', email, message: 'Will fail' } });
    ContactMessage.create = originalCreate;
    assert.equal(failedContact.status, 500, 'Contact storage failure is reported as a failure');
    assert.equal(failedContact.body.message, 'The server could not complete the request. Please try again later.');
    const contactPayload = { name: 'Rate Limit Test', email, message: 'Rate limit verification.' };
    const finalAllowedContact = await request(baseUrl, '/contact', { body: contactPayload });
    assert.equal(finalAllowedContact.status, 201, 'Contact submission remains available up to its per-IP threshold');
    createdContactIds.push(finalAllowedContact.body.data.id);
    assert.equal((await request(baseUrl, '/contact', { body: contactPayload })).status, 429, 'Limits repeated contact submissions');

    const knownRequest = await request(baseUrl, '/auth/password-reset-requests', { body: { email } });
    const unknownRequest = await request(baseUrl, '/auth/password-reset-requests', { body: { email: `unknown-${unique}@example.invalid` } });
    assert.equal(knownRequest.status, 202);
    assert.equal(unknownRequest.status, 202);
    assert.deepEqual(knownRequest.body, unknownRequest.body, 'Password reset request does not disclose account existence');
    assert.match(knownRequest.body.message, /delivery is not configured/i, 'Response reports unavailable email delivery');
    assert.ok(!JSON.stringify(knownRequest.body).includes('token'), 'Reset response contains no reset token');
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const allowedResetRequest = await request(baseUrl, '/auth/password-reset-requests', { body: { email: `unknown-${unique}-${attempt}@example.invalid` } });
      assert.equal(allowedResetRequest.status, 202, 'Reset request stays available below the per-IP threshold');
    }
    assert.equal((await request(baseUrl, '/auth/password-reset-requests', { body: { email: `unknown-${unique}-limited@example.invalid` } })).status, 429, 'Limits repeated password-reset requests');
    const storedResetRequest = await PasswordResetToken.findOne({ where: { user_id: user.id }, order: [['created_at', 'DESC']] });
    assert.ok(storedResetRequest, 'Known active account reset request is recorded');
    createdResetTokenIds.push(storedResetRequest.id);
    assert.match(storedResetRequest.token_hash, /^[a-f0-9]{64}$/i, 'Reset record stores a SHA-256 digest, not a plaintext token');
    assert.ok(storedResetRequest.expires_at > new Date(), 'Issued reset token expires in the future');

    const malformedToken = await request(baseUrl, '/auth/password-resets', { body: { token: 'bad-token', password: 'New-Valid-Password-123!' } });
    assert.equal(malformedToken.status, 400, 'Malformed reset token is rejected');

    const expiredRawToken = crypto.randomBytes(32).toString('base64url');
    const expiredRecord = await PasswordResetToken.create({
      user_id: user.id, token_hash: sha256(expiredRawToken), expires_at: new Date(Date.now() - 60_000),
    });
    createdResetTokenIds.push(expiredRecord.id);
    const expiredResponse = await request(baseUrl, '/auth/password-resets', { body: { token: expiredRawToken, password: 'New-Valid-Password-123!' } });
    assert.equal(expiredResponse.status, 400, 'Expired reset token is rejected');

    const rawToken = crypto.randomBytes(32).toString('base64url');
    const validRecord = await PasswordResetToken.create({
      user_id: user.id, token_hash: sha256(rawToken), expires_at: new Date(Date.now() + 10 * 60_000),
    });
    createdResetTokenIds.push(validRecord.id);
    assert.notEqual(validRecord.token_hash, rawToken, 'Raw token is not stored in the database');
    assert.equal(validRecord.token_hash, sha256(rawToken), 'Reset token is stored using the same SHA-256 digest validated by the reset endpoint');
    const newPassword = `New-Password-${unique}!`;
    const resetResponse = await request(baseUrl, '/auth/password-resets', { body: { token: rawToken, password: newPassword } });
    assert.equal(resetResponse.status, 200, 'Valid reset token updates the password');
    assert.ok(!JSON.stringify(resetResponse.body).includes(rawToken), 'Reset response does not return the raw token');
    const updatedUser = await User.findByPk(user.id);
    assert.match(updatedUser.password_hash, /^\$2[aby]\$\d{2}\$/, 'New password is stored as a bcrypt hash');
    assert.notEqual(updatedUser.password_hash, newPassword, 'Plaintext password is not stored');
    const usedRecord = await PasswordResetToken.findByPk(validRecord.id);
    assert.ok(usedRecord.used_at, 'Successful reset consumes the token');
    const staleSession = await request(baseUrl, '/membership/me', { method: 'GET', token: memberToken });
    assert.equal(staleSession.status, 401, 'Password reset revokes previously issued access tokens');
    const reuseResponse = await request(baseUrl, '/auth/password-resets', { body: { token: rawToken, password: 'Another-Password-123!' } });
    assert.equal(reuseResponse.status, 400, 'Reused reset token is rejected');
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const invalidAttempt = await request(baseUrl, '/auth/password-resets', { body: { token: crypto.randomBytes(32).toString('base64url'), password: 'Another-Password-123!' } });
      assert.equal(invalidAttempt.status, 400, 'Invalid reset token attempts below the limit are rejected safely');
    }
    assert.equal((await request(baseUrl, '/auth/password-resets', { body: { token: crypto.randomBytes(32).toString('base64url'), password: 'Another-Password-123!' } })).status, 429, 'Limits repeated reset-token verification attempts');

    const oldLogin = await request(baseUrl, '/auth/login', { body: { email, password: originalPassword } });
    const newLogin = await request(baseUrl, '/auth/login', { body: { email, password: newPassword } });
    assert.equal(oldLogin.status, 401, 'Old password no longer authenticates');
    assert.equal(newLogin.status, 200, 'New password works with the existing login flow');
    assert.ok(!JSON.stringify(newLogin.body).includes(newPassword), 'Login response does not expose plaintext password');
    assert.equal(newLogin.body.data.user.token_version, undefined, 'Token version is not exposed in the user API response');
    const newToken = newLogin.body.data.token;
    const meResponse = await request(baseUrl, '/auth/me', { method: 'GET', token: newToken });
    assert.equal(meResponse.status, 200, 'Newly issued versioned access token authenticates');
    assert.equal(meResponse.body.user.token_version, undefined, 'Current-user response does not expose token version');
    assert.ok(await AuditLog.findOne({ where: { user_id: user.id, action: 'PASSWORD_RESET_COMPLETED' } }), 'Successful reset creates an audit record without token or password values');

    const logoutResponse = await request(baseUrl, '/auth/logout', { method: 'POST', token: newToken });
    assert.equal(logoutResponse.status, 200, 'Logout revokes the authenticated token version');
    const loggedOutSession = await request(baseUrl, '/auth/me', { method: 'GET', token: newToken });
    assert.equal(loggedOutSession.status, 401, 'A logged-out access token is rejected on subsequent requests');

    console.log('Contact and password reset integration tests passed: validation, persistence, failure handling, non-enumeration, token expiry/use, password update, and login compatibility.');
  } finally {
    ContactMessage.create = originalCreate;
    if (createdContactIds.length) await ContactMessage.destroy({ where: { id: createdContactIds } });
    if (createdResetTokenIds.length) await PasswordResetToken.destroy({ where: { id: createdResetTokenIds } });
    if (createdUserIds.length) await AuditLog.destroy({ where: { user_id: createdUserIds } });
    if (createdUserIds.length) await User.destroy({ where: { id: createdUserIds } });

    const [remainingContacts, remainingTokens, remainingUsers, remainingAudit] = await Promise.all([
      createdContactIds.length ? ContactMessage.count({ where: { id: createdContactIds } }) : 0,
      createdResetTokenIds.length ? PasswordResetToken.count({ where: { id: createdResetTokenIds } }) : 0,
      createdUserIds.length ? User.count({ where: { id: createdUserIds } }) : 0,
      createdUserIds.length ? AuditLog.count({ where: { user_id: createdUserIds } }) : 0,
    ]);
    cleanupVerified = remainingContacts === 0 && remainingTokens === 0 && remainingUsers === 0 && remainingAudit === 0;
    assert.equal(cleanupVerified, true, 'Deletes only this test run records and verifies cleanup');
    if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await sequelize.close();
  }

  console.log(`Test cleanup verified: ${cleanupVerified}; ${createdContactIds.length} contact messages, ${createdResetTokenIds.length} reset tokens, and ${createdUserIds.length} test users removed.`);
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
