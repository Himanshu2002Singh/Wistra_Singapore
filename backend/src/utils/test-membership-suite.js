'use strict';

require('dotenv').config();
const assert = require('node:assert/strict');
const http = require('http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const paymentProofDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'wista-payment-suite-'));
process.env.PAYMENT_DOCUMENT_STORAGE_PATH = paymentProofDirectory;
process.env.BANK_ACCOUNT_NAME = 'WISTA Payment Test';
process.env.BANK_NAME = 'Test Bank';
process.env.BANK_ACCOUNT_NUMBER = '00000000';
const app = require('../app');
const sequelize = require('../config/database');
const { User, Role, MembershipApplication, MembershipStatusHistory, AuditLog, IndividualProfile, CorporateProfile, CorporateRepresentative, Payment, Invoice, Membership } = require('../models');
const industryCategories = require('../../../shared/industry-classification.json');
const { hashPassword } = require('./password');
const { generateToken } = require('./jwt');

let server;
let PORT = 5097;
const suiteUserIds = [];
const suiteApplicationIds = [];

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
  const [user, created] = await User.findOrCreate({
    where: { email },
    defaults: {
      first_name: 'AppTest',
      last_name: roleName,
      password_hash,
      role_id: role.id,
      status: 'ACTIVE',
    },
  });
  if (created) suiteUserIds.push(user.id);

  user.role_id = role.id;
  user.status = 'ACTIVE';
  await user.save();

  const token = generateToken({ sub: user.id, role: roleName });
  return { user, role, token };
};

const registerMember = async (email, first_name, last_name) => {
  const response = await request('/api/auth/register', 'POST', {
    email,
    password: 'Password123!',
    first_name,
    last_name,
    phone: '+65 91234567',
  });
  if (response.status !== 201 || !response.body.data?.token || response.body.data.user?.role?.name !== 'MEMBER') {
    throw new Error('Member registration did not create a member account and session.');
  }
  suiteUserIds.push(response.body.data.user.id);
  return { user: response.body.data.user, token: response.body.data.token };
};

const runTests = async () => {
  console.log('=== STARTING MEMBERSHIP APPLICATION SUITE VERIFICATION ===');
  await sequelize.authenticate();

  server = app.listen(PORT);

  try {
    const [[industry_main_category, industrySubCategories]] = Object.entries(industryCategories);
    const industry_sub_category = industrySubCategories[0];
    const applicantUser1 = await registerMember(`applicant1.${Date.now()}@example.com`, 'Individual', 'AppTest');
    const applicantUser2 = await registerMember(`applicant2.${Date.now()}@example.com`, 'Corporate', 'AppTest');
    const membershipAdmin = await createUserWithRole(`admin.mem.${Date.now()}@example.com`, 'MEMBERSHIP_ADMIN');
    const financeAdmin = await createUserWithRole(`admin.finance.${Date.now()}@example.com`, 'SUPER_ADMIN');

    // 1. Submit Individual Application
    console.log('\n[1] Testing Individual Application Submission...');
    const indRes = await request('/api/membership/applications', 'POST', {
      membership_type: 'INDIVIDUAL',
      company: 'PSA International',
      designation: 'Senior Director',
      biography: 'Over 15 years in port logistics.',
      nationality: 'Singaporean',
      phone: '+65 91234567',
      invoicing_address: '1 Harbourfront Place, Singapore',
    }, applicantUser1.token);

    console.log('Individual Submission Response:', indRes.status, indRes.body);
    if (indRes.status !== 201 || !indRes.body.data?.application_number) {
      throw new Error('Individual application submission failed');
    }
    const indAppId = indRes.body.data.id;
    suiteApplicationIds.push(indAppId);
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
      designation: 'Senior Director',
      biography: 'Over 15 years in port logistics.',
      phone: '+65 91234567',
      invoicing_address: '1 Harbourfront Place, Singapore',
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
      invoicing_address: '1 HarbourFront Place, Singapore',
      invoicing_contact_person: 'Finance Manager',
      invoicing_email: 'finance@pil.com.sg',
      main_contacts: 'Test primary corporate contact',
      additional_contacts: 'Test additional corporate contact',
      industry_main_category,
      industry_sub_category,
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
    suiteApplicationIds.push(corpAppId);

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

    const resumedReview = await request(`/api/admin/applications/${indAppId}/review`, 'PATCH', null, membershipAdmin.token);
    if (resumedReview.status !== 200 || resumedReview.body.data.status !== 'UNDER_REVIEW') {
      throw new Error('Application could not return to review after clarification.');
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
    const approvedPayment = await Payment.findOne({ where: { application_id: indAppId } });
    const approvedInvoice = approvedPayment && await Invoice.findOne({ where: { payment_id: approvedPayment.id } });
    assert.ok(approvedPayment && approvedInvoice, 'Individual approval creates a payment record and invoice');
    assert.equal(Number(approvedInvoice.total), 150, 'Individual invoice uses the configured SGD 150 fee');
    assert.equal(approvedInvoice.membership_type, 'INDIVIDUAL', 'Invoice is linked to the correct membership type');
    assert.equal(await Membership.count({ where: { application_id: indAppId, status: 'ACTIVE' } }), 0, 'Approval does not activate membership before payment verification');
    const approvalRetry = await request(`/api/admin/applications/${indAppId}/approve`, 'PATCH', { review_remarks: 'Retry approval request' }, membershipAdmin.token);
    assert.equal(approvalRetry.status, 200, 'Approval retry is idempotent');
    assert.equal(await Payment.count({ where: { application_id: indAppId } }), 1, 'Approval retry does not create duplicate payment');
    assert.equal(await Invoice.count({ where: { application_id: indAppId } }), 1, 'Approval retry does not create duplicate invoice');

    const submitForm = new FormData();
    submitForm.append('payment_method', 'BANK_TRANSFER');
    submitForm.append('transaction_reference', 'TEST-TRANSFER-001');
    submitForm.append('transfer_date', new Date().toISOString().slice(0, 10));
    submitForm.append('amount', '150.00');
    submitForm.append('proof', new Blob([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1])], { type: 'image/png' }), 'receipt.png');
    const submitResponse = await fetch(`http://127.0.0.1:${PORT}/api/payments/${approvedPayment.id}/submit`, { method: 'POST', headers: { Authorization: `Bearer ${applicantUser1.token}` }, body: submitForm });
    assert.equal(submitResponse.status, 200, 'Applicant can submit a transfer receipt for Finance review');
    const verification = await request(`/api/admin/payments/${approvedPayment.id}/verify`, 'PATCH', {}, financeAdmin.token);
    assert.equal(verification.status, 200, 'Finance can verify the submitted membership payment');
    assert.equal(await Membership.count({ where: { application_id: indAppId, status: 'ACTIVE' } }), 1, 'Verified payment activates exactly one membership');
    const verificationRetry = await request(`/api/admin/payments/${approvedPayment.id}/verify`, 'PATCH', {}, financeAdmin.token);
    assert.equal(verificationRetry.status, 200, 'Verification retry is idempotent');
    assert.equal(await Membership.count({ where: { application_id: indAppId, status: 'ACTIVE' } }), 1, 'Verification retry does not duplicate membership activation');

    // 10. Admin Reject Application
    console.log('\n[10] Testing Admin Reject Corporate Application...');
    const corpReview = await request(`/api/admin/applications/${corpAppId}/review`, 'PATCH', null, membershipAdmin.token);
    if (corpReview.status !== 200 || corpReview.body.data.status !== 'UNDER_REVIEW') {
      throw new Error('Corporate application could not be placed under review before rejection.');
    }
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
    if (suiteApplicationIds.length) {
      const testPayments = await Payment.findAll({ where: { application_id: suiteApplicationIds }, attributes: ['id'] });
      const testPaymentIds = testPayments.map(({ id }) => id);
      if (testPaymentIds.length) await Invoice.destroy({ where: { payment_id: testPaymentIds } });
      if (testPaymentIds.length) await Payment.destroy({ where: { id: testPaymentIds } });
      await Membership.destroy({ where: { application_id: suiteApplicationIds } });
      await MembershipStatusHistory.destroy({ where: { application_id: suiteApplicationIds } });
      await AuditLog.destroy({ where: { entity_type: 'MembershipApplication', entity_id: suiteApplicationIds.map(String) } });
      await MembershipApplication.destroy({ where: { id: suiteApplicationIds } });
    }
    if (suiteUserIds.length) {
      const corporateProfiles = await CorporateProfile.findAll({ where: { user_id: suiteUserIds }, attributes: ['id'] });
      const corporateProfileIds = corporateProfiles.map(({ id }) => id);
      if (corporateProfileIds.length) await CorporateRepresentative.destroy({ where: { corporate_profile_id: corporateProfileIds } });
      await IndividualProfile.destroy({ where: { user_id: suiteUserIds } });
      await CorporateProfile.destroy({ where: { user_id: suiteUserIds } });
      await AuditLog.destroy({ where: { user_id: suiteUserIds } });
      await User.destroy({ where: { id: suiteUserIds } });
    }
    if (suiteApplicationIds.length) assert.equal(await MembershipApplication.count({ where: { id: suiteApplicationIds } }), 0, 'Cleans up only applications created by this suite');
    if (suiteUserIds.length) assert.equal(await User.count({ where: { id: suiteUserIds } }), 0, 'Cleans up only users created by this suite');
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    fs.rmSync(paymentProofDirectory, { recursive: true, force: true });
    await sequelize.close();
  }
};

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    fs.rmSync(paymentProofDirectory, { recursive: true, force: true });
    console.error('\n❌ MEMBERSHIP APPLICATION SUITE FAILED:', err);
    process.exit(1);
  });
