'use strict';

require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const app = require('../app');
const { sequelize, User, Role, Membership, IndividualProfile, DirectoryPrivacySettings } = require('../models');
const { hashPassword } = require('./password');
const { generateToken } = require('./jwt');

const createdUserIds = [];
const createdMembershipIds = [];
const createdRoleIds = [];
let server;

const createActor = async (roleName, email) => {
  let role = await Role.findOne({ where: { name: roleName } });
  if (roleName === 'DIRECTORY_TEST_NO_PERMISSION') {
    role = await Role.create({ name: roleName, description: 'Temporary directory authorization test role' });
    createdRoleIds.push(role.id);
  }
  assert.ok(role, `Requires the existing ${roleName} role`);
  const user = await User.create({
    first_name: 'Directory', last_name: `Test ${createdUserIds.length + 1}`, email,
    password_hash: await hashPassword(`Directory-Test-${Date.now()}-${Math.random()}!`),
    role_id: role.id, status: 'ACTIVE', phone: '+6599990000', profile_photo: 'https://example.invalid/profile.png',
  });
  createdUserIds.push(user.id);
  return { user, token: generateToken({ sub: user.id, role: roleName }) };
};

const createMemberRecord = async (user, { status = 'ACTIVE', endDate, privacy, company, designation } = {}) => {
  const membership = await Membership.create({
    user_id: user.id,
    membership_type: 'INDIVIDUAL',
    membership_number: `DIR-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    status,
    start_date: '2020-06-01',
    end_date: endDate ?? '2099-05-31',
  });
  createdMembershipIds.push(membership.id);
  await IndividualProfile.create({
    user_id: user.id,
    company: company || 'Directory Test Company',
    designation: designation || 'Maritime Researcher',
    biography: 'Private-aware directory test biography',
    linkedin_url: 'https://www.linkedin.com/in/directory-test',
    photo_url: 'https://example.invalid/member.png',
    nationality: 'Test Nationality',
    date_of_birth: '1990-01-01',
    invoicing_address: 'Sensitive billing address',
  });
  if (privacy) await DirectoryPrivacySettings.create({ user_id: user.id, ...privacy });
  return membership;
};

const request = async (baseUrl, endpoint, token) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(`${baseUrl}${endpoint}`, { headers });
  return { status: response.status, body: await response.json() };
};

const run = async () => {
  await sequelize.authenticate();
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  let cleanupVerified = false;

  try {
    const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const visible = await createActor('MEMBER', `directory-visible-${unique}@example.invalid`);
    const hidden = await createActor('MEMBER', `directory-hidden-${unique}@example.invalid`);
    const expired = await createActor('MEMBER', `directory-expired-${unique}@example.invalid`);
    const suspended = await createActor('MEMBER', `directory-suspended-${unique}@example.invalid`);
    const admin = await createActor('EVENTS_ADMIN', `directory-admin-${unique}@example.invalid`);
    const deniedRole = await createActor('DIRECTORY_TEST_NO_PERMISSION', `directory-denied-${unique}@example.invalid`);

    await createMemberRecord(visible.user, { company: 'Harbor Analytics', designation: 'Port Director' });
    await createMemberRecord(hidden.user, {
      company: 'Hidden Harbor',
      privacy: { show_email: false, show_phone: false, show_company: false, show_designation: false, show_bio: false, show_linkedin: false, show_photo: false },
    });
    await createMemberRecord(expired.user, { endDate: '2000-05-31' });
    await createMemberRecord(suspended.user, { status: 'SUSPENDED' });

    assert.equal((await request(baseUrl, '/membership/directory')).status, 401, 'Directory requires authentication');
    assert.equal((await request(baseUrl, '/membership/directory', admin.token)).status, 200, 'Existing directory permission grants access to an authorized administrative role');
    assert.equal((await request(baseUrl, '/membership/directory', deniedRole.token)).status, 403, 'An authenticated role without directory permission is denied');
    const response = await request(baseUrl, '/membership/directory?page=1&pageSize=50', visible.token);
    assert.equal(response.status, 200, 'Permitted member can access directory');
    const rows = response.body.data.members;
    const byId = new Map(rows.map((row) => [String(row.id), row]));
    assert.ok(byId.has(String(visible.user.id)), 'Current active member appears');
    assert.ok(byId.has(String(hidden.user.id)), 'Current active member with private fields still appears');
    assert.ok(!byId.has(String(expired.user.id)), 'Expired active record is excluded by effective Singapore-date status');
    assert.ok(!byId.has(String(suspended.user.id)), 'Suspended membership is excluded');

    const visibleRow = byId.get(String(visible.user.id));
    assert.equal(visibleRow.email, visible.user.email, 'Default email visibility follows existing settings');
    assert.equal(visibleRow.phone, null, 'Phone defaults to private under existing settings');
    assert.equal(visibleRow.company, 'Harbor Analytics');
    const hiddenRow = byId.get(String(hidden.user.id));
    for (const field of ['email', 'phone', 'company', 'designation', 'biography', 'linkedin_url', 'photo_url']) {
      assert.equal(hiddenRow[field], null, `Privacy setting excludes ${field}`);
    }
    for (const row of rows) {
      for (const field of ['password_hash', 'nationality', 'date_of_birth', 'invoicing_address', 'storage_key', 'auditLogs', 'permissions']) {
        assert.equal(Object.hasOwn(row, field), false, `Directory response never includes sensitive field ${field}`);
      }
    }

    const searchResult = await request(baseUrl, '/membership/directory?search=Port%20Director', visible.token);
    assert.equal(searchResult.status, 200);
    assert.deepEqual(searchResult.body.data.members.map(({ id }) => String(id)), [String(visible.user.id)], 'Search uses visible profile fields');
    const hiddenSearch = await request(baseUrl, '/membership/directory?search=Hidden%20Harbor', visible.token);
    assert.deepEqual(hiddenSearch.body.data.members, [], 'Private company cannot be used to discover a member through search');
    const companyFilter = await request(baseUrl, '/membership/directory?company=Harbor%20Analytics', visible.token);
    assert.deepEqual(companyFilter.body.data.members.map(({ id }) => String(id)), [String(visible.user.id)], 'Company filter uses an existing visible profile field');
    const privateCompanyFilter = await request(baseUrl, '/membership/directory?company=Hidden%20Harbor', visible.token);
    assert.deepEqual(privateCompanyFilter.body.data.members, [], 'Private company cannot be used to discover a member through filtering');
    assert.equal((await request(baseUrl, '/membership/directory?email=private%40example.invalid', visible.token)).status, 400, 'Unsupported query parameter cannot request private fields');

    const pageOne = await request(baseUrl, '/membership/directory?page=1&pageSize=1', visible.token);
    const pageTwo = await request(baseUrl, '/membership/directory?page=2&pageSize=1', visible.token);
    assert.equal(pageOne.body.data.pagination.pageSize, 1, 'Pagination page size is applied');
    assert.equal(pageOne.body.data.members.length, 1);
    assert.equal(pageTwo.body.data.members.length, 1);
    assert.notEqual(String(pageOne.body.data.members[0].id), String(pageTwo.body.data.members[0].id));
    assert.equal((await request(baseUrl, '/membership/directory?pageSize=5000', visible.token)).status, 400, 'Pagination size is bounded');

    console.log('Member directory integration tests passed: authentication/RBAC, eligibility, search, pagination, privacy, and sensitive-field projection.');
  } finally {
    if (createdMembershipIds.length) await Membership.destroy({ where: { id: createdMembershipIds } });
    if (createdUserIds.length) {
      await DirectoryPrivacySettings.destroy({ where: { user_id: createdUserIds } });
      await IndividualProfile.destroy({ where: { user_id: createdUserIds } });
      await User.destroy({ where: { id: createdUserIds } });
    }
    if (createdRoleIds.length) await Role.destroy({ where: { id: createdRoleIds } });
    const [remainingMemberships, remainingUsers, remainingProfiles, remainingPrivacy] = await Promise.all([
      createdMembershipIds.length ? Membership.count({ where: { id: createdMembershipIds } }) : 0,
      createdUserIds.length ? User.count({ where: { id: createdUserIds } }) : 0,
      createdUserIds.length ? IndividualProfile.count({ where: { user_id: createdUserIds } }) : 0,
      createdUserIds.length ? DirectoryPrivacySettings.count({ where: { user_id: createdUserIds } }) : 0,
    ]);
    cleanupVerified = remainingMemberships === 0 && remainingUsers === 0 && remainingProfiles === 0 && remainingPrivacy === 0;
    const remainingRoles = createdRoleIds.length ? await Role.count({ where: { id: createdRoleIds } }) : 0;
    cleanupVerified = cleanupVerified && remainingRoles === 0;
    assert.equal(cleanupVerified, true, 'Deletes only test-created records and verifies cleanup');
    if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await sequelize.close();
  }

  console.log(`Test cleanup verified: ${cleanupVerified}; ${createdUserIds.length} test users and ${createdMembershipIds.length} test memberships removed.`);
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
