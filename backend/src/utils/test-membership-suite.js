'use strict';

require('dotenv').config();
const http = require('http');
const app = require('../app');
const sequelize = require('../config/database');
const { User, Role } = require('../models');
const { hashPassword } = require('./password');
const { generateToken } = require('./jwt');

let server;
let PORT = 5097;

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
      first_name: 'AppTest',
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
  console.log('=== STARTING MEMBERSHIP APPLICATION SUITE VERIFICATION ===');
  await sequelize.authenticate();

  server = app.listen(PORT);

  try {
    const applicantUser1 = await createUserWithRole(`applicant1.${Date.now()}@example.com`, 'MEMBER');
    const applicantUser2 = await createUserWithRole(`applicant2.${Date.now()}@example.com`, 'MEMBER');
    const membershipAdmin = await createUserWithRole(`admin.mem.${Date.now()}@example.com`, 'MEMBERSHIP_ADMIN');

    // 1. Submit Individual Application
    console.log('\n[1] Testing Individual Application Submission...');
    const indRes = await request('/api/membership/applications', 'POST', {
      membership_type: 'INDIVIDUAL',
      company: 'PSA International',
      designation: 'Senior Director',
      biography: 'Over 15 years in port logistics.',
      nationality: 'Singaporean',
      invoicing_address: '1 Harbourfront Place, Singapore',
    }, applicantUser1.token);

    console.log('Individual Submission Response:', indRes.status, indRes.body);
    if (indRes.status !== 201 || !indRes.body.data?.application_number) {
      throw new Error('Individual application submission failed');
    }
    const indAppId = indRes.body.data.id;
    const indAppNum = indRes.body.data.application_number;
    if (!indAppNum.startsWith('WISTA-APP-')) {
      throw new Error('Application number format invalid!');
    }

    // 2. Fetch My Applications
    console.log('\n[2] Testing GET /api/membership/applications/me...');
    const myApps = await request('/api/membership/applications/me', 'GET', null, applicantUser1.token);
    console.log('My Apps Response:', myApps.status, 'Count:', myApps.body.data?.applications?.length);
    if (myApps.status !== 200 || myApps.body.data.applications.length === 0) {
      throw new Error('Fetching my applications failed');
    }

    // 3. Prevent Duplicate Active Application
    console.log('\n[3] Testing Duplicate Application Protection...');
    const dupRes = await request('/api/membership/applications', 'POST', {
      membership_type: 'INDIVIDUAL',
      company: 'PSA International',
    }, applicantUser1.token);

    console.log('Duplicate Submission Response (409):', dupRes.status, dupRes.body.message);
    if (dupRes.status !== 409) {
      throw new Error('Duplicate application protection failed!');
    }

    // 4. Submit Corporate Application
    console.log('\n[4] Testing Corporate Application Submission...');
    const corpRes = await request('/api/membership/applications', 'POST', {
      membership_type: 'CORPORATE',
      company_name: 'Pacific International Lines (PIL)',
      company_description: 'Global container shipping line.',
      invoicing_contact_person: 'Finance Manager',
      invoicing_email: 'finance@pil.com.sg',
      representatives: [
        { name: 'Rep 1', email: 'rep1@pil.com.sg', designation: 'VP Shipping', is_primary: true },
        { name: 'Rep 2', email: 'rep2@pil.com.sg', designation: 'Fleet Manager', is_primary: false },
      ],
    }, applicantUser2.token);

    console.log('Corporate Submission Response:', corpRes.status, corpRes.body.data?.application_number);
    if (corpRes.status !== 201 || !corpRes.body.data?.application_number) {
      throw new Error('Corporate application submission failed');
    }
    const corpAppId = corpRes.body.data.id;

    // 5. Admin List Applications
    console.log('\n[5] Testing Admin Applications List (RBAC)...');
    const adminList = await request('/api/admin/applications', 'GET', null, membershipAdmin.token);
    console.log('Admin List Response:', adminList.status, 'Total:', adminList.body.data?.total);
    if (adminList.status !== 200 || adminList.body.data.total < 2) {
      throw new Error('Admin applications list failed');
    }

    // 6. Member forbidden from Admin Applications List
    console.log('\n[6] Testing Member Access to Admin Endpoints (403 Forbidden)...');
    const memberForbidden = await request('/api/admin/applications', 'GET', null, applicantUser1.token);
    console.log('Member Forbidden Response:', memberForbidden.status, memberForbidden.body);
    if (memberForbidden.status !== 403) {
      throw new Error('Member should be forbidden from admin endpoints');
    }

    // 7. Admin Review Application (PENDING -> UNDER_REVIEW)
    console.log('\n[7] Testing Admin Place Application Under Review...');
    const reviewRes = await request(`/api/admin/applications/${indAppId}/review`, 'PATCH', null, membershipAdmin.token);
    console.log('Review Response:', reviewRes.status, reviewRes.body.data?.status);
    if (reviewRes.status !== 200 || reviewRes.body.data.status !== 'UNDER_REVIEW') {
      throw new Error('Review application failed');
    }

    // 8. Admin Request Clarification
    console.log('\n[8] Testing Admin Request Clarification...');
    const clarRes = await request(`/api/admin/applications/${indAppId}/clarification`, 'PATCH', {
      review_remarks: 'Please upload certified copy of maritime management certificate.',
    }, membershipAdmin.token);

    console.log('Clarification Response:', clarRes.status, clarRes.body.data?.status);
    if (clarRes.status !== 200 || clarRes.body.data.status !== 'CLARIFICATION_REQUIRED') {
      throw new Error('Clarification request failed');
    }

    // 9. Admin Approve Application -> PAYMENT_PENDING
    console.log('\n[9] Testing Admin Approve Application (APPROVAL != ACTIVATION)...');
    const appRes = await request(`/api/admin/applications/${indAppId}/approve`, 'PATCH', {
      review_remarks: 'Approved by EXCO board meeting 2026-09. Proceed to payment.',
    }, membershipAdmin.token);

    console.log('Approve Response:', appRes.status, appRes.body.data?.status);
    if (appRes.status !== 200 || appRes.body.data.status !== 'PAYMENT_PENDING') {
      throw new Error('Approval should transition status to PAYMENT_PENDING');
    }

    // 10. Admin Reject Application
    console.log('\n[10] Testing Admin Reject Corporate Application...');
    const rejRes = await request(`/api/admin/applications/${corpAppId}/reject`, 'PATCH', {
      review_remarks: 'Organization does not meet maritime industry criteria.',
    }, membershipAdmin.token);

    console.log('Reject Response:', rejRes.status, rejRes.body.data?.status);
    if (rejRes.status !== 200 || rejRes.body.data.status !== 'REJECTED') {
      throw new Error('Rejection failed');
    }

    // 11. Testing Invalid Transition: Approve REJECTED application (409 Conflict)
    console.log('\n[11] Testing Invalid Transition: Approve REJECTED Application (409 Conflict)...');
    const invalidApproveRes = await request(`/api/admin/applications/${corpAppId}/approve`, 'PATCH', {
      review_remarks: 'Attempting invalid approve on rejected app',
    }, membershipAdmin.token);
    console.log('Invalid Approve Response:', invalidApproveRes.status, invalidApproveRes.body.message);
    if (invalidApproveRes.status !== 409) {
      throw new Error(`Expected status 409 for invalid transition, got ${invalidApproveRes.status}`);
    }

    // 12. Testing Invalid Transition: Review PAYMENT_PENDING application (409 Conflict)
    console.log('\n[12] Testing Invalid Transition: Place PAYMENT_PENDING Under Review (409 Conflict)...');
    const invalidReviewRes = await request(`/api/admin/applications/${indAppId}/review`, 'PATCH', null, membershipAdmin.token);
    console.log('Invalid Review Response:', invalidReviewRes.status, invalidReviewRes.body.message);
    if (invalidReviewRes.status !== 409) {
      throw new Error(`Expected status 409 for invalid transition, got ${invalidReviewRes.status}`);
    }

    console.log('\n✅ ALL MEMBERSHIP APPLICATION TESTS PASSED SUCCESSFULLY!');
  } finally {
    if (server) {
      server.close();
    }
  }
};

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ MEMBERSHIP APPLICATION SUITE FAILED:', err);
    process.exit(1);
  });
