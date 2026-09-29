'use strict';

require('dotenv').config();
const http = require('http');
const app = require('../app');
const sequelize = require('../config/database');
const { User, Role } = require('../models');
const { hashPassword } = require('./password');
const { generateToken } = require('./jwt');

let server;
let PORT = 5099;

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
  if (!role) throw new Error(`Role ${roleName} not found`);

  const password_hash = await hashPassword('Password123!');
  const [user] = await User.findOrCreate({
    where: { email },
    defaults: {
      first_name: 'ActTest',
      last_name: roleName,
      password_hash,
      role_id: role.id,
      status: 'ACTIVE',
    },
  });

  user.role_id = role.id;
  user.status = 'ACTIVE';
  await user.save();

  const token = generateToken({ sub: user.id, role: roleName });
  return { user, role, token };
};

const runTests = async () => {
  console.log('=== STARTING MEMBERSHIP ACTIVATION & LIFECYCLE SUITE VERIFICATION ===');
  await sequelize.authenticate();

  server = app.listen(PORT);

  try {
    const member1 = await createUserWithRole(`actmember1.${Date.now()}@example.com`, 'MEMBER');
    const member2 = await createUserWithRole(`actmember2.${Date.now()}@example.com`, 'MEMBER');
    const membershipAdmin = await createUserWithRole(`actadmin.${Date.now()}@example.com`, 'MEMBERSHIP_ADMIN');
    const financeAdmin = await createUserWithRole(`actfinance.${Date.now()}@example.com`, 'FINANCE_ADMIN');

    // 1. Submit Application for Member 1
    console.log('\n[1] Submitting Application for Member 1...');
    const appRes = await request('/api/membership/applications', 'POST', {
      membership_type: 'INDIVIDUAL',
      company: 'Keppel Offshore',
      designation: 'General Counsel',
    }, member1.token);

    const appId1 = appRes.body.data.id;

    // 2. Attempt Activation on Unapproved / Unpaid Application (Should Fail 409)
    console.log('\n[2] Testing Activation Protection: Unapproved Application (409 Conflict)...');
    const unapprovedActRes = await request('/api/admin/memberships/activate', 'POST', {
      application_id: appId1,
    }, membershipAdmin.token);

    console.log('Unapproved Activation Response:', unapprovedActRes.status, unapprovedActRes.body.message);
    if (unapprovedActRes.status !== 409) {
      throw new Error('Unapproved application should not be activated');
    }

    // 3. Approve Application & Attempt Activation Without Payment (Should Fail 409)
    console.log('\n[3] Approving Application & Testing Activation Without Payment (409 Conflict)...');
    await request(`/api/admin/applications/${appId1}/approve`, 'PATCH', {
      review_remarks: 'Approved by EXCO board',
    }, membershipAdmin.token);

    const unpaidActRes = await request('/api/admin/memberships/activate', 'POST', {
      application_id: appId1,
    }, membershipAdmin.token);

    console.log('Unpaid Activation Response:', unpaidActRes.status, unpaidActRes.body.message);
    if (unpaidActRes.status !== 409) {
      throw new Error('Unpaid application should not be activated');
    }

    // 4. Create & Verify Payment
    console.log('\n[4] Creating & Verifying Payment for Member 1...');
    const payRes = await request('/api/payments', 'POST', {
      application_id: appId1,
      payment_method: 'PAYNOW',
    }, member1.token);

    const payId = payRes.body.data.payment.id;
    await request(`/api/admin/payments/${payId}/verify`, 'PATCH', {
      transaction_reference: 'PAYNOW-VERIFIED-7711',
    }, financeAdmin.token);

    // 5. Activate Membership (Approved + Paid)
    console.log('\n[5] Activating Membership for Approved + Paid Application...');
    const actRes = await request('/api/admin/memberships/activate', 'POST', {
      application_id: appId1,
    }, membershipAdmin.token);

    console.log('Activation Response:', actRes.status, actRes.body.data?.membership_number);
    if (actRes.status !== 201 || !actRes.body.data?.membership_number) {
      throw new Error('Membership activation failed');
    }

    const memId = actRes.body.data.id;
    const memNum = actRes.body.data.membership_number;

    if (!memNum.startsWith('WISTA-SG-')) {
      throw new Error('Membership number format invalid');
    }

    if (actRes.body.data.status !== 'ACTIVE') {
      throw new Error('Membership status should be ACTIVE');
    }

    // 6. Duplicate Activation Protection
    console.log('\n[6] Testing Duplicate Activation Protection (409 Conflict)...');
    const dupActRes = await request('/api/admin/memberships/activate', 'POST', {
      application_id: appId1,
    }, membershipAdmin.token);

    console.log('Duplicate Activation Response:', dupActRes.status, dupActRes.body.message);
    if (dupActRes.status !== 409) {
      throw new Error('Duplicate activation protection failed');
    }

    // 7. Member 1 Portal API GET /api/membership/me
    console.log('\n[7] Testing GET /api/membership/me (Digital Card & Dashboard Data)...');
    const meRes = await request('/api/membership/me', 'GET', null, member1.token);
    console.log('My Membership Response:', meRes.status, 'Number:', meRes.body.data?.card?.membership_number, 'Status:', meRes.body.data?.effective_status);

    if (meRes.status !== 200 || !meRes.body.data?.card?.membership_number || meRes.body.data.effective_status !== 'ACTIVE') {
      throw new Error('Member portal GET /api/membership/me failed');
    }

    // 8. Admin Suspend Membership
    console.log('\n[8] Testing Admin Suspend Membership...');
    const suspRes = await request(`/api/admin/memberships/${memId}/suspend`, 'PATCH', {
      reason: 'Pending conduct review by Disciplinary Panel',
    }, membershipAdmin.token);

    console.log('Suspend Response:', suspRes.status, suspRes.body.data?.status);
    if (suspRes.status !== 200 || suspRes.body.data.status !== 'SUSPENDED') {
      throw new Error('Membership suspension failed');
    }

    // Check effective status in GET /api/membership/me for suspended user
    const suspMeRes = await request('/api/membership/me', 'GET', null, member1.token);
    console.log('Suspended User Effective Status:', suspMeRes.body.data.effective_status);
    if (suspMeRes.body.data.effective_status !== 'SUSPENDED') {
      throw new Error('Effective status for suspended member should be SUSPENDED');
    }

    // 9. Admin Reactivate Membership
    console.log('\n[9] Testing Admin Reactivate Membership...');
    const reactRes = await request(`/api/admin/memberships/${memId}/reactivate`, 'PATCH', null, membershipAdmin.token);
    console.log('Reactivate Response:', reactRes.status, reactRes.body.data?.status);
    if (reactRes.status !== 200 || reactRes.body.data.status !== 'ACTIVE') {
      throw new Error('Membership reactivation failed');
    }

    // 10. Admin Cancel Membership
    console.log('\n[10] Testing Admin Cancel Membership...');
    const cancelRes = await request(`/api/admin/memberships/${memId}/cancel`, 'PATCH', {
      cancellation_reason: 'Member requested voluntary withdrawal from society',
    }, membershipAdmin.token);

    console.log('Cancel Response:', cancelRes.status, cancelRes.body.data?.status);
    if (cancelRes.status !== 200 || cancelRes.body.data.status !== 'CANCELLED') {
      throw new Error('Membership cancellation failed');
    }

    // 11. Security Check: Normal member cannot suspend
    console.log('\n[11] Testing Security: Normal member attempting suspend (403 Forbidden)...');
    const secRes = await request(`/api/admin/memberships/${memId}/suspend`, 'PATCH', {
      reason: 'Unauthorized attempt',
    }, member2.token);

    console.log('Security Response:', secRes.status, secRes.body.message);
    if (secRes.status !== 403) {
      throw new Error('Normal member should be forbidden from admin endpoints');
    }

    console.log('\n✅ ALL MEMBERSHIP ACTIVATION & LIFECYCLE TESTS PASSED SUCCESSFULLY!');
  } finally {
    if (server) {
      server.close();
    }
  }
};

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ ACTIVATION SUITE FAILED:', err);
    process.exit(1);
  });
