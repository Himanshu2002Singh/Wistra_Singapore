'use strict';

require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const app = require('../app');
const { sequelize, MembershipApplication, StudentProfile, AuditLog, Membership, User, Role, IndividualProfile, CorporateProfile, CorporateRepresentative, MembershipStatusHistory } = require('../models');
const { validateApplicationBody } = require('../controllers/membershipApplicationController');
const industryCategories = require('../../../shared/industry-classification.json');
const { hashPassword } = require('./password');
const { generateToken } = require('./jwt');

const storageDir = path.resolve(process.env.STUDENT_DOCUMENT_STORAGE_PATH || path.join(__dirname, '../../private/student-documents'));
const date = new Date();
const yyyy = date.getUTCFullYear();
const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
const dd = String(date.getUTCDate()).padStart(2, '0');
const email = `student-test-${Date.now()}@example.invalid`;
const applicationFields = {
  first_name: 'Student', last_name: 'Test', email, mobile_number: '+65 8123 4567',
  invoicing_address: '1 Test Street, Singapore', nationality: 'Testland', date_of_birth: '2000-01-01',
  institution_name: 'Test University', degree_type: 'Bachelor', field_of_study: 'Maritime Studies',
  enrollment_type: 'FULL_TIME', graduation_month: String(date.getUTCMonth() + 1), graduation_year: String(yyyy),
};
const corporateApplicationFields = {
  membership_type: 'CORPORATE', company_name: 'Classification Test Organization', company_description: 'Test application.',
  invoicing_address: '1 Test Street', invoicing_contact_person: 'Test Contact', invoicing_email: 'test@example.invalid',
  main_contacts: 'Test Contact', additional_contacts: 'None',
};

for (const [mainCategory, subCategories] of Object.entries(industryCategories)) {
  for (const subCategory of subCategories) {
    const result = validateApplicationBody({ ...corporateApplicationFields, industry_main_category: mainCategory, industry_sub_category: subCategory });
    assert.equal(result.errors, undefined, `Accepts the supplied mapping: ${mainCategory} / ${subCategory}`);
  }
}
assert.ok(validateApplicationBody({ ...corporateApplicationFields, industry_main_category: 'Unknown', industry_sub_category: 'Ship Manager' }).errors);
assert.ok(validateApplicationBody({ ...corporateApplicationFields, industry_main_category: 'Ship Owners & Operators', industry_sub_category: 'Shipyard / Ship Repair' }).errors);
assert.ok(validateApplicationBody({ ...corporateApplicationFields, industry_main_category: 'Ship Owners & Operators' }).errors);

const buildForm = ({ includeDocument = true, invalidDocument = false, overrides = {}, oversizedDocument = false } = {}) => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ ...applicationFields, ...overrides })) form.append(key, value);
  if (includeDocument) {
    const contents = oversizedDocument ? Buffer.alloc(5 * 1024 * 1024 + 1, 65) : invalidDocument ? Buffer.from('not a real document') : Buffer.from('%PDF-1.4\nStudent test proof\n%%EOF\n');
    form.append('proof_of_enrollment', new Blob([contents], { type: invalidDocument ? 'text/plain' : 'application/pdf' }), 'proof.pdf');
  }
  return form;
};

const run = async () => {
  await sequelize.authenticate();
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  let applicationId;
  let storageKey;
  let adminUserId;
  const legacyUserIds = [];
  try {
    const adminRole = await Role.findOne({ where: { name: 'SUPER_ADMIN' } });
    assert.ok(adminRole, 'Requires the existing super administrator role');
    const admin = await User.create({
      first_name: 'Integration', last_name: 'Test', email: `student-admin-test-${Date.now()}@example.invalid`,
      password_hash: await hashPassword(`Temporary-${Date.now()}-Credential!`), role_id: adminRole.id, status: 'ACTIVE',
    });
    adminUserId = admin.id;
    const adminToken = generateToken({ sub: admin.id, role: 'SUPER_ADMIN' });
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    const invalidResponse = await fetch(`${baseUrl}/membership/applications/student`, { method: 'POST', body: buildForm({ invalidDocument: true }) });
    assert.equal(invalidResponse.status, 400, 'Rejects invalid supporting document content');

    const missingResponse = await fetch(`${baseUrl}/membership/applications/student`, { method: 'POST', body: buildForm({ includeDocument: false }) });
    assert.equal(missingResponse.status, 400, 'Requires a supporting document');

    const invalidPhoneResponse = await fetch(`${baseUrl}/membership/applications/student`, { method: 'POST', body: buildForm({ overrides: { mobile_number: 'abc' } }) });
    assert.equal(invalidPhoneResponse.status, 400, 'Validates international mobile number input');
    const invalidDateResponse = await fetch(`${baseUrl}/membership/applications/student`, { method: 'POST', body: buildForm({ overrides: { date_of_birth: '2024-02-30' } }) });
    assert.equal(invalidDateResponse.status, 400, 'Rejects invalid calendar dates');
    const invalidEmailResponse = await fetch(`${baseUrl}/membership/applications/student`, { method: 'POST', body: buildForm({ overrides: { email: 'not-an-email' } }) });
    assert.equal(invalidEmailResponse.status, 400, 'Validates email format');
    const oversizedResponse = await fetch(`${baseUrl}/membership/applications/student`, { method: 'POST', body: buildForm({ oversizedDocument: true }) });
    assert.equal(oversizedResponse.status, 413, 'Rejects documents over the configured size limit');

    const submitResponse = await fetch(`${baseUrl}/membership/applications/student`, { method: 'POST', body: buildForm() });
    assert.equal(submitResponse.status, 201, 'Accepts valid student application');
    const submitted = await submitResponse.json();
    applicationId = submitted.data.id;

    const duplicateResponse = await fetch(`${baseUrl}/membership/applications/student`, { method: 'POST', body: buildForm() });
    assert.equal(duplicateResponse.status, 409, 'Rejects duplicate email/application submission');

    const application = await MembershipApplication.findByPk(applicationId);
    const profile = await StudentProfile.findOne({ where: { application_id: applicationId } });
    assert.equal(application.membership_type, 'STUDENT', 'Persists distinct membership type');
    assert.equal(application.status, 'PENDING', 'Persists application in existing review workflow');
    assert.equal(profile.email, email, 'Persists submitted student fields');
    assert.equal(profile.field_of_study, applicationFields.field_of_study, 'Persists education information');
    storageKey = profile.document_storage_key;
    await fs.access(path.join(storageDir, storageKey));

    const listingResponse = await fetch(`${baseUrl}/admin/applications?membership_type=STUDENT&search=${encodeURIComponent(email)}`, { headers: adminHeaders });
    assert.equal(listingResponse.status, 200, 'Makes Student applications visible in Admin Applications');
    const listing = await listingResponse.json();
    assert.ok(listing.data.applications.some((item) => String(item.id) === String(applicationId)), 'Admin application listing includes Student record');

    const detailResponse = await fetch(`${baseUrl}/admin/applications/${applicationId}`, { headers: adminHeaders });
    assert.equal(detailResponse.status, 200, 'Allows authorized administrator to view Student details');
    const detail = await detailResponse.json();
    assert.equal(detail.data.profiles.student.institution_name, applicationFields.institution_name, 'Admin view contains education details');
    assert.equal(detail.data.profiles.student.document_storage_key, undefined, 'Admin API does not expose the storage key');

    const authorizedDownload = await fetch(`${baseUrl}/admin/applications/${applicationId}/student-document`, { headers: adminHeaders });
    assert.equal(authorizedDownload.status, 200, 'Allows an authorized administrator to download the document');
    assert.equal((await authorizedDownload.arrayBuffer()).byteLength > 0, true, 'Returns actual uploaded document bytes');

    const reviewResponse = await fetch(`${baseUrl}/admin/applications/${applicationId}/review`, { method: 'PATCH', headers: adminHeaders });
    assert.equal(reviewResponse.status, 200, 'Preserves Student application in the existing review workflow');
    const approvalResponse = await fetch(`${baseUrl}/admin/applications/${applicationId}/approve`, { method: 'PATCH', headers: { ...adminHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ review_remarks: 'Integration approval check.' }) });
    assert.equal(approvalResponse.status, 200, 'Moves reviewed Student application to the existing payment boundary');
    const approved = await MembershipApplication.findByPk(applicationId);
    assert.equal(approved.membership_type, 'STUDENT', 'Membership type survives status transitions');
    assert.equal(approved.status, 'PAYMENT_PENDING', 'Approval does not activate the membership');
    assert.equal(await Membership.count({ where: { application_id: applicationId } }), 0, 'Approval does not automatically create or activate a membership');

    for (const membershipType of ['INDIVIDUAL', 'CORPORATE']) {
      const legacyEmail = `${membershipType.toLowerCase()}-regression-${Date.now()}-${legacyUserIds.length}@example.invalid`;
      const registration = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: legacyEmail, password: `Temporary-${Date.now()}-Credential!`, first_name: 'Regression', last_name: membershipType, phone: '+65 8123 4567' }),
      });
      assert.equal(registration.status, 201, `${membershipType} account registration remains available`);
      const registered = await registration.json();
      const token = registered.data.token;
      legacyUserIds.push(registered.data.user.id);
      const individual = membershipType === 'INDIVIDUAL';
      const applicationBody = individual ? {
        membership_type: 'INDIVIDUAL', company: 'Regression Company', designation: 'Manager', biography: 'Regression test profile.',
        invoicing_address: '1 Test Street', phone: '+65 8123 4567',
      } : {
        membership_type: 'CORPORATE', company_name: 'Regression Organization', company_description: 'Regression test profile.',
        invoicing_address: '1 Test Street', invoicing_contact_person: 'Regression Contact', invoicing_email: legacyEmail,
        main_contacts: 'Regression Contact', additional_contacts: 'None',
        industry_main_category: 'Professional Services', industry_sub_category: 'Maritime Consultant',
      };
      const applicationResponse = await fetch(`${baseUrl}/membership/applications`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(applicationBody),
      });
      assert.equal(applicationResponse.status, 201, `${membershipType} application workflow remains available`);
      if (membershipType === 'CORPORATE') {
        const registeredApplication = await applicationResponse.json();
        const corporateProfile = await CorporateProfile.findOne({ where: { user_id: registered.data.user.id } });
        assert.equal(corporateProfile.industry_main_category, applicationBody.industry_main_category, 'Persists corporate main industry category');
        assert.equal(corporateProfile.industry_sub_category, applicationBody.industry_sub_category, 'Persists corporate sub-category');
        const detailResponse = await fetch(`${baseUrl}/admin/applications/${registeredApplication.data.id}`, { headers: adminHeaders });
        assert.equal(detailResponse.status, 200, 'Corporate application remains available in admin review');
        const corporateDetail = await detailResponse.json();
        assert.equal(corporateDetail.data.profiles.corporate.industry_main_category, applicationBody.industry_main_category, 'Admin detail displays corporate main category');
        assert.equal(corporateDetail.data.profiles.corporate.industry_sub_category, applicationBody.industry_sub_category, 'Admin detail displays corporate sub-category');
      }
    }

    const protectedDownload = await fetch(`${baseUrl}/admin/applications/${applicationId}/student-document`);
    assert.equal(protectedDownload.status, 401, 'Requires authentication before document access');

    console.log(`Registration integration checks passed: ${Object.values(industryCategories).flat().length} industry mappings, Student field/upload validation, persistence, duplicate prevention, Admin review and protected documents, plus Individual/Corporate regression flows.`);
  } finally {
    if (applicationId) {
      await MembershipStatusHistory.destroy({ where: { application_id: applicationId } });
      await StudentProfile.destroy({ where: { application_id: applicationId } });
      await AuditLog.destroy({ where: { entity_type: 'MembershipApplication', entity_id: String(applicationId) } });
      await MembershipApplication.destroy({ where: { id: applicationId } });
    }
    if (legacyUserIds.length) {
      const legacyApplications = await MembershipApplication.findAll({ where: { user_id: legacyUserIds }, attributes: ['id'] });
      const legacyApplicationIds = legacyApplications.map(({ id }) => id);
      if (legacyApplicationIds.length) {
        await MembershipStatusHistory.destroy({ where: { application_id: legacyApplicationIds } });
        await AuditLog.destroy({ where: { entity_type: 'MembershipApplication', entity_id: legacyApplicationIds.map(String) } });
        await MembershipApplication.destroy({ where: { id: legacyApplicationIds } });
      }
      const corporateProfiles = await CorporateProfile.findAll({ where: { user_id: legacyUserIds }, attributes: ['id'] });
      const corporateIds = corporateProfiles.map(({ id }) => id);
      if (corporateIds.length) await CorporateRepresentative.destroy({ where: { corporate_profile_id: corporateIds } });
      await IndividualProfile.destroy({ where: { user_id: legacyUserIds } });
      await CorporateProfile.destroy({ where: { user_id: legacyUserIds } });
      await AuditLog.destroy({ where: { user_id: legacyUserIds } });
      await User.destroy({ where: { id: legacyUserIds } });
    }
    if (adminUserId) {
      await AuditLog.destroy({ where: { user_id: adminUserId } });
      await User.destroy({ where: { id: adminUserId } });
    }
    if (storageKey) await fs.unlink(path.join(storageDir, storageKey)).catch(() => {});
    await new Promise((resolve) => server.close(resolve));
    await sequelize.close();
  }
};

run().catch((error) => {
  console.error('Student registration integration checks failed:', error.message);
  process.exitCode = 1;
});
