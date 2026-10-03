'use strict';

require('dotenv').config();
const http = require('http');
const app = require('../app');
const sequelize = require('../config/database');
const { User, Role } = require('../models');
const { hashPassword } = require('./password');
const { generateToken } = require('./jwt');

let server;
let PORT = 5098;

const request = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = body ? JSON.stringify(body) : null;
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
};

const createUserWithRole = async (email, roleName) => {
  const role = await Role.findOne({ where: { name: roleName } });
  if (!role) {
    throw new Error(`Role ${roleName} not found`);
  }

  const password_hash = await hashPassword('Password123!');
  const [user] = await User.findOrCreate({
    where: { email },
    defaults: {
      first_name: 'Test',
      last_name: roleName,
      password_hash,
      role_id: role.id,
      status: 'ACTIVE',
    },
  });

  // Ensure role_id is set
  user.role_id = role.id;
  user.status = 'ACTIVE';
  await user.save();

  const token = generateToken({ sub: user.id, role: roleName });
  return { user, role, token };
};

const runTests = async () => {
  console.log('=== STARTING RBAC & PERMISSION SUITE VERIFICATION ===');
  await sequelize.authenticate();

  server = app.listen(PORT);
  const testEmailPrefix = `rbac.${Date.now()}.`;
  const createdUserIds = [];

  try {
    // Setup test users for each role
    const superAdmin = await createUserWithRole(`${testEmailPrefix}superadmin@example.com`, 'SUPER_ADMIN');
    const membershipAdmin = await createUserWithRole(`${testEmailPrefix}membership@example.com`, 'MEMBERSHIP_ADMIN');
    const financeAdmin = await createUserWithRole(`${testEmailPrefix}finance@example.com`, 'FINANCE_ADMIN');
    const eventsAdmin = await createUserWithRole(`${testEmailPrefix}events@example.com`, 'EVENTS_ADMIN');
    const commsAdmin = await createUserWithRole(`${testEmailPrefix}comms@example.com`, 'COMMUNICATIONS_ADMIN');
    const normalMember = await createUserWithRole(`${testEmailPrefix}member@example.com`, 'MEMBER');
    createdUserIds.push(superAdmin.user.id, membershipAdmin.user.id, financeAdmin.user.id, eventsAdmin.user.id, commsAdmin.user.id, normalMember.user.id);

    console.log('\n[1] Testing Unauthenticated Requests (401)...');
    const unauth = await request('/api/rbac-test/superadmin');
    console.log('Unauthenticated Response:', unauth.status, unauth.body);
    if (unauth.status !== 401) throw new Error('Unauthenticated request should return 401');

    console.log('\n[2] Testing Invalid Token (401)...');
    const badToken = await request('/api/rbac-test/superadmin', 'GET', null, 'bad.token.str');
    console.log('Bad Token Response:', badToken.status, badToken.body);
    if (badToken.status !== 401) throw new Error('Bad token request should return 401');

    const unauthenticatedMemberApi = await request('/api/membership/me');
    if (unauthenticatedMemberApi.status !== 401) throw new Error('Member API should require authentication');

    console.log('\n[3] Testing SUPER_ADMIN Access (Full Pass)...');
    const superRes1 = await request('/api/rbac-test/superadmin', 'GET', null, superAdmin.token);
    const superRes2 = await request('/api/rbac-test/membership', 'GET', null, superAdmin.token);
    const superRes3 = await request('/api/rbac-test/finance', 'GET', null, superAdmin.token);
    console.log('SUPER_ADMIN superadmin route:', superRes1.status, superRes1.body.message);
    console.log('SUPER_ADMIN membership route:', superRes2.status, superRes2.body.message);
    console.log('SUPER_ADMIN finance route:', superRes3.status, superRes3.body.message);
    if (superRes1.status !== 200 || superRes2.status !== 200 || superRes3.status !== 200) {
      throw new Error('SUPER_ADMIN should have access to all routes');
    }
    const superAdminMemberApi = await request('/api/membership/me', 'GET', null, superAdmin.token);
    if (superAdminMemberApi.status !== 403) throw new Error('Member-only APIs should not treat admin roles as members');

    console.log('\n[4] Testing MEMBERSHIP_ADMIN Permissions...');
    const memRes1 = await request('/api/rbac-test/membership', 'GET', null, membershipAdmin.token);
    const memRes2 = await request('/api/rbac-test/finance', 'GET', null, membershipAdmin.token);
    console.log('MEMBERSHIP_ADMIN membership route:', memRes1.status);
    console.log('MEMBERSHIP_ADMIN finance route (Forbidden):', memRes2.status, memRes2.body);
    if (memRes1.status !== 200 || memRes2.status !== 403) {
      throw new Error('MEMBERSHIP_ADMIN permission check failed');
    }
    const applicationAdminApi = await request('/api/admin/applications', 'GET', null, membershipAdmin.token);
    if (applicationAdminApi.status !== 200) throw new Error('Membership admin should access the protected application API');

    console.log('\n[5] Testing FINANCE_ADMIN Permissions...');
    const finRes1 = await request('/api/rbac-test/finance', 'GET', null, financeAdmin.token);
    const finRes2 = await request('/api/rbac-test/membership', 'GET', null, financeAdmin.token);
    console.log('FINANCE_ADMIN finance route:', finRes1.status);
    console.log('FINANCE_ADMIN membership route (Forbidden):', finRes2.status, finRes2.body);
    if (finRes1.status !== 200 || finRes2.status !== 403) {
      throw new Error('FINANCE_ADMIN permission check failed');
    }
    const paymentAdminApi = await request('/api/admin/payments', 'GET', null, financeAdmin.token);
    if (paymentAdminApi.status !== 200) throw new Error('Finance admin should access the protected payments API');

    console.log('\n[6] Testing EVENTS_ADMIN Permissions...');
    const eveRes1 = await request('/api/rbac-test/events', 'GET', null, eventsAdmin.token);
    const eveRes2 = await request('/api/rbac-test/finance', 'GET', null, eventsAdmin.token);
    console.log('EVENTS_ADMIN events route:', eveRes1.status);
    console.log('EVENTS_ADMIN finance route (Forbidden):', eveRes2.status);
    if (eveRes1.status !== 200 || eveRes2.status !== 403) {
      throw new Error('EVENTS_ADMIN permission check failed');
    }

    console.log('\n[7] Testing COMMUNICATIONS_ADMIN Permissions...');
    const comRes1 = await request('/api/rbac-test/communications', 'GET', null, commsAdmin.token);
    const comRes2 = await request('/api/rbac-test/events', 'GET', null, commsAdmin.token);
    console.log('COMMUNICATIONS_ADMIN comms route:', comRes1.status);
    console.log('COMMUNICATIONS_ADMIN events route (Forbidden):', comRes2.status);
    if (comRes1.status !== 200 || comRes2.status !== 403) {
      throw new Error('COMMUNICATIONS_ADMIN permission check failed');
    }

    console.log('\n[8] Testing MEMBER Admin Route Access (All Forbidden)...');
    const memberSuper = await request('/api/rbac-test/superadmin', 'GET', null, normalMember.token);
    const memberMem = await request('/api/rbac-test/membership', 'GET', null, normalMember.token);
    const memberFin = await request('/api/rbac-test/finance', 'GET', null, normalMember.token);
    console.log('MEMBER superadmin route (403):', memberSuper.status);
    console.log('MEMBER membership route (403):', memberMem.status);
    console.log('MEMBER finance route (403):', memberFin.status);
    if (memberSuper.status !== 403 || memberMem.status !== 403 || memberFin.status !== 403) {
      throw new Error('MEMBER must be denied access (403) on administrative routes');
    }
    const memberAdminApplications = await request('/api/admin/applications', 'GET', null, normalMember.token);
    const memberAdminPayments = await request('/api/admin/payments', 'GET', null, normalMember.token);
    const ownMembership = await request('/api/membership/me', 'GET', null, normalMember.token);
    if (memberAdminApplications.status !== 403 || memberAdminPayments.status !== 403 || ownMembership.status !== 200) {
      throw new Error('Member/admin API authorization checks failed');
    }

    console.log('\n[9] Testing Privilege Escalation (Forged Token Claim)...');
    // Forging a JWT token claiming 'SUPER_ADMIN' role in payload for a normal MEMBER user in DB
    const forgedToken = generateToken({ sub: normalMember.user.id, role: 'SUPER_ADMIN' });
    const forgedRes = await request('/api/rbac-test/superadmin', 'GET', null, forgedToken);
    console.log('Forged Token Response (Forbidden 403):', forgedRes.status, forgedRes.body);
    if (forgedRes.status !== 403) {
      throw new Error('SECURITY VIOLATION: Server trusted role in JWT token payload instead of DB role!');
    }

    console.log('\n✅ ALL RBAC & PERMISSION TESTS PASSED SUCCESSFULLY!');
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (createdUserIds.length) await User.destroy({ where: { id: createdUserIds } });
  }
};

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ RBAC SUITE FAILED:', err);
    process.exit(1);
  });
