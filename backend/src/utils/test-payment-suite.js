'use strict';

require('dotenv').config();
const http = require('http');
const app = require('../app');
const sequelize = require('../config/database');
const {
  User,
  Role,
  Payment,
  Invoice,
  MembershipApplication,
  IndividualProfile,
  CorporateProfile,
  CorporateRepresentative,
  AuditLog,
} = require('../models');
const { hashPassword } = require('./password');
const { generateToken } = require('./jwt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

let server;
let PORT = 5098;
const testUsers = [];

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
      first_name: 'PayTest',
      last_name: roleName,
      password_hash,
      role_id: role.id,
      status: 'ACTIVE',
    },
  });

  user.role_id = role.id;
  user.status = 'ACTIVE';
  await user.save();
  testUsers.push(user);

  const token = generateToken({ sub: user.id, role: roleName });
  return { user, role, token };
};

const runTests = async () => {
  console.log('=== STARTING PAYMENT & INVOICE SUITE VERIFICATION ===');
  await sequelize.authenticate();

  server = app.listen(PORT);

  try {
    const member1 = await createUserWithRole(`member1.${Date.now()}@example.com`, 'MEMBER');
    const member2 = await createUserWithRole(`member2.${Date.now()}@example.com`, 'MEMBER');
    const financeAdmin = await createUserWithRole(`finance.${Date.now()}@example.com`, 'FINANCE_ADMIN');
    const membershipAdmin = await createUserWithRole(`memadmin.${Date.now()}@example.com`, 'MEMBERSHIP_ADMIN');

    for (const member of [member1, member2]) {
      const login = await request('/api/auth/login', 'POST', {
        email: member.user.email,
        password: 'Password123!',
      });
      if (login.status !== 200 || !login.body.data?.token) throw new Error('Member login failed before payment history check');
      member.token = login.body.data.token;
    }

    const emptyPayments = await request('/api/payments/my', 'GET', null, member2.token);
    if (emptyPayments.status !== 200 || !Array.isArray(emptyPayments.body.data) || emptyPayments.body.data.length !== 0) {
      throw new Error('A member without payment history should receive an empty payment list');
    }
    const noAuthPayments = await request('/api/payments/my');
    const expiredToken = jwt.sign({ sub: member2.user.id }, process.env.JWT_SECRET, { expiresIn: -1 });
    const expiredPayments = await request('/api/payments/my', 'GET', null, expiredToken);
    if (noAuthPayments.status !== 401 || expiredPayments.status !== 401) {
      throw new Error('Payment history endpoint should reject missing and expired authentication');
    }

    // 1. Submit and Approve Application for Member 1
    console.log('\n[1] Submitting and Approving Application for Member 1...');
    const subRes = await request('/api/membership/applications', 'POST', {
      membership_type: 'INDIVIDUAL',
      company: 'Port Authority',
      designation: 'Operations Director',
    }, member1.token);

    const appId1 = subRes.body.data.id;

    // Approve application -> PAYMENT_PENDING
    await request(`/api/admin/applications/${appId1}/approve`, 'PATCH', {
      review_remarks: 'Approved by EXCO board',
    }, membershipAdmin.token);

    // 2. Member 1 creates Payment & Invoice
    console.log('\n[2] Testing Payment Creation for Approved Application (Server-Side Fee)...');
    const payRes = await request('/api/payments', 'POST', {
      application_id: appId1,
      payment_method: 'PAYNOW',
    }, member1.token);

    console.log('Payment Creation Response:', payRes.status, payRes.body);
    if (payRes.status !== 201 || !payRes.body.data?.payment?.payment_reference) {
      throw new Error('Payment creation failed');
    }

    const paymentId = payRes.body.data.payment.id;
    const invoiceId = payRes.body.data.invoice.id;
    const payRef = payRes.body.data.payment.payment_reference;
    const invNum = payRes.body.data.invoice.invoice_number;

    const foreignPaymentSubmit = await request(`/api/payments/${paymentId}/submit`, 'POST', {
      payment_method: 'PAYNOW',
      transaction_reference: 'FOREIGN-REFERENCE',
    }, member2.token);
    if (foreignPaymentSubmit.status !== 404) throw new Error('A different member must not submit proof for this payment');

    if (parseFloat(payRes.body.data.payment.amount) !== 150) {
      throw new Error(`Expected amount 150.00 SGD for Individual, got ${payRes.body.data.payment.amount}`);
    }

    if (!payRef.startsWith('PAY-') || !invNum.startsWith('WISTA-SG-')) {
      throw new Error('Reference formats invalid');
    }

    // 3. Duplicate Payment Protection
    console.log('\n[3] Testing Duplicate Payment Protection (409 Conflict)...');
    const dupPayRes = await request('/api/payments', 'POST', {
      application_id: appId1,
      payment_method: 'BANK_TRANSFER',
    }, member1.token);

    console.log('Duplicate Payment Response:', dupPayRes.status, dupPayRes.body.message);
    if (dupPayRes.status !== 409) {
      throw new Error('Duplicate payment protection failed');
    }

    // 4. Submit PayNow Reference Details
    console.log('\n[4] Testing Manual Payment Reference Submission (PayNow)...');
    const submitRes = await request(`/api/payments/${paymentId}/submit`, 'POST', {
      payment_method: 'PAYNOW',
      transaction_reference: 'PAYNOW-REF-99887766',
      notes: 'Transferred via UOB PayNow QR',
    }, member1.token);

    console.log('Submit Payment Response:', submitRes.status, submitRes.body.data?.payment_status);
    if (submitRes.status !== 200 || submitRes.body.data.payment_status !== 'SUBMITTED') {
      throw new Error('Payment submission failed');
    }

    // 5. Fetch My Payments & My Invoice
    console.log('\n[5] Testing GET /api/payments/my and GET /api/invoices/:id...');
    const myPays = await request('/api/payments/my', 'GET', null, member1.token);
    console.log('My Payments Count:', myPays.status, myPays.body.data?.length);
    if (myPays.status !== 200 || myPays.body.data.length === 0) {
      throw new Error('Get my payments failed');
    }
    if (myPays.body.data[0]?.payment_status !== 'SUBMITTED'
      || myPays.body.data[0]?.payment_method !== 'PAYNOW'
      || myPays.body.data[0]?.payment_reference !== payRef
      || myPays.body.data[0]?.invoice?.invoice_number !== invNum) {
      throw new Error('Member payment list did not return the payment and related invoice data');
    }
    const member2Payments = await request('/api/payments/my', 'GET', null, member2.token);
    if (member2Payments.status !== 200 || member2Payments.body.data.some((payment) => String(payment.id) === String(paymentId))) {
      throw new Error('Member payment list exposed another member\'s payment');
    }

    const invRes = await request(`/api/invoices/${invoiceId}`, 'GET', null, member1.token);
    console.log('Invoice Response:', invRes.status, invRes.body.data?.invoice_number);
    if (invRes.status !== 200 || invRes.body.data.id !== invoiceId) {
      throw new Error('Get invoice failed');
    }
    if (invRes.body.data.invoice_number !== invNum || invRes.body.data.status !== 'ISSUED'
      || Number(invRes.body.data.total) !== Number(payRes.body.data.invoice.total)) {
      throw new Error('Invoice endpoint did not return its stored values');
    }
    const invoiceNoAuth = await request(`/api/invoices/${invoiceId}`);
    const invoiceExpired = await request(`/api/invoices/${invoiceId}`, 'GET', null, expiredToken);
    const invoiceNotFound = await request('/api/invoices/999999999', 'GET', null, member1.token);
    if (invoiceNoAuth.status !== 401 || invoiceExpired.status !== 401 || invoiceNotFound.status !== 404) {
      throw new Error('Invoice endpoint should enforce authentication, expiration, and not-found handling');
    }

    const hiddenPaymentsFindAll = Payment.findAll;
    let paymentServerError;
    try {
      Payment.findAll = async () => { throw new Error('Simulated payment data failure'); };
      paymentServerError = await request('/api/payments/my', 'GET', null, member1.token);
    } finally {
      Payment.findAll = hiddenPaymentsFindAll;
    }
    if (paymentServerError?.status !== 500) throw new Error('Payment API should return 500 on a simulated service failure');

    // 6. Security IDOR Check: Member 2 cannot view Member 1's invoice
    console.log('\n[6] Testing IDOR Security: Member 2 accessing Member 1 invoice (403 Forbidden)...');
    const idorRes = await request(`/api/invoices/${invoiceId}`, 'GET', null, member2.token);
    console.log('IDOR Response:', idorRes.status, idorRes.body.message);
    if (idorRes.status !== 403) {
      throw new Error('IDOR security protection failed! Member 2 was able to view invoice.');
    }

    // 7. Finance Admin List Payments
    console.log('\n[7] Testing Admin GET /api/admin/payments (Finance Admin)...');
    const adminList = await request('/api/admin/payments', 'GET', null, financeAdmin.token);
    console.log('Admin Payments Count:', adminList.status, adminList.body.data?.total);
    if (adminList.status !== 200 || adminList.body.data.total === 0) {
      throw new Error('Admin payments list failed');
    }

    // 8. Finance Admin Verify Payment
    console.log('\n[8] Testing Finance Admin Verify Payment...');
    const verifyRes = await request(`/api/admin/payments/${paymentId}/verify`, 'PATCH', {
      transaction_reference: 'CONFIRMED-BANK-REF-1010',
      notes: 'Verified against DBS bank statement',
    }, financeAdmin.token);

    console.log('Verify Response:', verifyRes.status, verifyRes.body.data?.payment?.payment_status);
    if (verifyRes.status !== 200 || verifyRes.body.data.payment.payment_status !== 'PAID') {
      throw new Error('Payment verification failed');
    }

    // Verify Invoice status updated to PAID
    if (verifyRes.body.data.invoice.status !== 'PAID') {
      throw new Error('Invoice status should be updated to PAID on payment verification');
    }
    const refreshedPayments = await request('/api/payments/my', 'GET', null, member1.token);
    if (refreshedPayments.body.data.find((payment) => String(payment.id) === String(paymentId))?.payment_status !== 'PAID') {
      throw new Error('Payment history refetch did not reflect the updated backend status');
    }

    // 9. Verify Non-Activation (Application remains in application review state, NOT active member)
    console.log('\n[9] Verifying Application Status (Payment Verified != Membership Activation)...');
    const appCheck = await request(`/api/admin/applications/${appId1}`, 'GET', null, membershipAdmin.token);
    console.log('Application Status After Payment Verification:', appCheck.body.data.application.status);
    // Application should still be PAYMENT_PENDING (or APPROVED) awaiting Step 8 activation

    // 10. Complimentary Membership Payment
    console.log('\n[10] Testing Complimentary Payment Creation for Corporate App...');
    const corpSub = await request('/api/membership/applications', 'POST', {
      membership_type: 'CORPORATE',
      company_name: 'Maritime Tech Corp',
    }, member2.token);

    const corpAppId = corpSub.body.data.id;
    await request(`/api/admin/applications/${corpAppId}/approve`, 'PATCH', {
      review_remarks: 'Approved for complimentary tier',
    }, membershipAdmin.token);

    const compRes = await request('/api/admin/payments/complimentary', 'POST', {
      application_id: corpAppId,
      notes: 'Sponsor complimentary account',
    }, financeAdmin.token);

    console.log('Complimentary Payment Response:', compRes.status, compRes.body.data?.payment?.payment_status, 'Amount:', compRes.body.data?.payment?.amount);
    if (compRes.status !== 201 || parseFloat(compRes.body.data.payment.amount) !== 0 || compRes.body.data.payment.payment_status !== 'PAID') {
      throw new Error('Complimentary payment creation failed');
    }

    console.log('\n✅ ALL PAYMENT & INVOICE SUITE TESTS PASSED SUCCESSFULLY!');
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    const userIds = testUsers.map((user) => user.id);
    if (userIds.length) {
      const corporateProfiles = await CorporateProfile.findAll({ where: { user_id: userIds }, attributes: ['id'] });
      const corporateProfileIds = corporateProfiles.map((profile) => profile.id);
      await Invoice.destroy({ where: { user_id: userIds } });
      await Payment.destroy({ where: { user_id: userIds } });
      await AuditLog.destroy({ where: { user_id: userIds } });
      await CorporateRepresentative.destroy({ where: {
        [Op.or]: [
          { user_id: userIds },
          ...(corporateProfileIds.length ? [{ corporate_profile_id: corporateProfileIds }] : []),
        ],
      } });
      await IndividualProfile.destroy({ where: { user_id: userIds } });
      if (corporateProfileIds.length) await CorporateProfile.destroy({ where: { id: corporateProfileIds } });
      await MembershipApplication.destroy({ where: { user_id: userIds } });
      await User.destroy({ where: { id: userIds } });
    }
  }
};

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ PAYMENT & INVOICE SUITE FAILED:', err);
    process.exit(1);
  });
