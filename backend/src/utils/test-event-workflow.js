'use strict';

require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const app = require('../app');
const { sequelize, User, Role, Event, EventRegistration, Payment, PaymentSubmission, Invoice, AuditLog } = require('../models');
const { hashPassword } = require('./password');
const { generateToken } = require('./jwt');

const createdUserIds = [];
const createdEventIds = [];
const createdProofPaths = [];
let server;

const actor = async (role, email) => {
  const roleRow = await Role.findOne({ where: { name: role } });
  assert.ok(roleRow, `Requires the existing ${role} role`);
  const user = await User.create({
    first_name: 'Event', last_name: 'Workflow Test', email,
    password_hash: await hashPassword(`Event-Test-${Date.now()}-${Math.random()}!`),
    role_id: roleRow.id, status: 'ACTIVE',
  });
  createdUserIds.push(user.id);
  return { user, token: generateToken({ sub: user.id, role }) };
};

const request = async (baseUrl, endpoint, { method = 'GET', body, token } = {}) => {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const responseBody = await response.json();
  return { status: response.status, body: responseBody };
};

const createEvent = async (baseUrl, token, values) => {
  const response = await request(baseUrl, '/admin/content/events', { method: 'POST', token, body: values });
  assert.equal(response.status, 201, `Creates ${values.status} test event`);
  createdEventIds.push(response.body.data.id);
  return response.body.data;
};

const run = async () => {
  await sequelize.authenticate();
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;

  try {
    const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const admin = await actor('EVENTS_ADMIN', `event-admin-${unique}@example.invalid`);
    const finance = await actor('SUPER_ADMIN', `event-finance-${unique}@example.invalid`);
    const memberOne = await actor('MEMBER', `event-member-one-${unique}@example.invalid`);
    const memberTwo = await actor('MEMBER', `event-member-two-${unique}@example.invalid`);
    const future = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const past = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const eventInput = (title, starts_at, status) => ({
      title, description: `${title} database integration event.`, event_type: 'Forum', location: 'Singapore', starts_at, status,
    });

    const publishedEvent = await createEvent(baseUrl, admin.token, eventInput(`Published Event ${unique}`, future(2), 'PUBLISHED'));
    const concurrentEvent = await createEvent(baseUrl, admin.token, eventInput(`Concurrent Event ${unique}`, future(3), 'PUBLISHED'));
    const limitedEvent = await createEvent(baseUrl, admin.token, { ...eventInput(`Limited Event ${unique}`, future(4), 'PUBLISHED'), capacity: 1 });
    const paidEvent = await createEvent(baseUrl, admin.token, { ...eventInput(`Paid Event ${unique}`, future(4), 'PUBLISHED'), is_free: false, member_price: 80 });
    const unpricedEvent = await Event.create({ ...eventInput(`Unpriced Event ${unique}`, future(5), 'PUBLISHED'), is_free: false, member_price: null, non_member_price: null, created_by: admin.user.id });
    createdEventIds.push(unpricedEvent.id);
    const draftEvent = await createEvent(baseUrl, admin.token, eventInput(`Draft Event ${unique}`, future(4), 'DRAFT'));
    const pastEvent = await createEvent(baseUrl, admin.token, eventInput(`Past Event ${unique}`, past(2), 'PUBLISHED'));
    const cancelledEvent = await Event.create({
      ...eventInput(`Cancelled Event ${unique}`, future(5), 'DRAFT'),
      status: 'CANCELLED', created_by: admin.user.id,
    });
    createdEventIds.push(cancelledEvent.id);

    const publishedList = await request(baseUrl, '/content/events');
    assert.equal(publishedList.status, 200, 'Lists published events through the existing public endpoint');
    const listedIds = publishedList.body.data.events.map(({ id }) => String(id));
    assert.ok(listedIds.includes(String(publishedEvent.id)), 'Published Admin event appears in public and member catalog');
    assert.ok(listedIds.includes(String(pastEvent.id)), 'Published past event remains available for event history/details');
    assert.ok(!listedIds.includes(String(draftEvent.id)), 'Draft event is excluded from the public catalog');
    assert.ok(!listedIds.includes(String(cancelledEvent.id)), 'Cancelled event is excluded from the public catalog');

    const adminList = await request(baseUrl, '/admin/content/events', { token: admin.token });
    assert.equal(adminList.status, 200, 'Admin event listing continues to work');
    assert.ok(adminList.body.data.some(({ id }) => String(id) === String(draftEvent.id)), 'Admin can still see its draft event');
    assert.equal((await request(baseUrl, '/admin/content/events', { token: memberOne.token })).status, 403, 'Members cannot access the permission-protected Admin event list');
    assert.equal((await request(baseUrl, '/admin/content/events', { method: 'POST', token: memberOne.token, body: eventInput('Forbidden', future(6), 'PUBLISHED') })).status, 403, 'Members cannot create Admin events');
    assert.equal((await request(baseUrl, `/admin/content/events/${publishedEvent.id}`, { method: 'PATCH', token: memberOne.token, body: { title: 'Forbidden edit' } })).status, 403, 'Members cannot modify Admin events');
    const editedEvent = await request(baseUrl, `/admin/content/events/${publishedEvent.id}`, { method: 'PATCH', token: admin.token, body: { image_url: 'https://example.invalid/event.jpg', format: 'HYBRID', capacity: 10, registration_closes_at: future(1) } });
    assert.equal(editedEvent.status, 200, 'Authorized events admins can edit event details and registration settings');
    assert.equal(editedEvent.body.data.format, 'HYBRID', 'Event format persists through the edit endpoint');
    assert.equal((await request(baseUrl, '/admin/content/events', { method: 'POST', token: admin.token, body: { ...eventInput('Bad capacity', future(8), 'DRAFT'), capacity: -3 } })).status, 400, 'Invalid capacity is rejected');

    const publishedDetail = await request(baseUrl, `/content/events/${publishedEvent.id}`);
    assert.equal(publishedDetail.status, 200, 'Returns details for an individual published event');
    assert.equal(publishedDetail.body.data.event.title, publishedEvent.title, 'Event details match the Admin-created record');
    assert.equal((await request(baseUrl, `/content/events/${draftEvent.id}`)).status, 404, 'Unpublished event detail is not disclosed');
    assert.equal((await request(baseUrl, `/content/events/${cancelledEvent.id}`)).status, 404, 'Cancelled event detail is not disclosed');
    assert.equal((await request(baseUrl, '/content/events/not-an-id')).status, 404, 'Rejects invalid event identifiers');

    const noTokenHistory = await request(baseUrl, '/membership/events/registrations/me');
    assert.equal(noTokenHistory.status, 401, 'Registration history requires authentication');
    assert.equal((await request(baseUrl, `/membership/events/${publishedEvent.id}/registrations`, { method: 'POST' })).status, 401, 'Event registration requires authentication');
    assert.equal((await request(baseUrl, `/membership/events/${publishedEvent.id}/registrations`, { method: 'POST', token: admin.token })).status, 403, 'Administrative accounts cannot use the member registration route');

    const firstRegistration = await request(baseUrl, `/membership/events/${publishedEvent.id}/registrations`, { method: 'POST', token: memberOne.token });
    assert.equal(firstRegistration.status, 201, 'Authenticated member can register for a published future event');
    const registration = firstRegistration.body.data.registration;
    assert.equal(registration.status, 'REGISTERED', 'Returns the established registration status');
    assert.equal(registration.payment_status, 'NOT_REQUIRED', 'Free registration explicitly requires no payment');
    assert.match(registration.ticket_uid, /^[0-9a-f-]{36}$/i, 'Free registration receives its entry UID');
    assert.equal((await request(baseUrl, '/admin/content/events/check-in', { method: 'POST', token: memberOne.token, body: { ticket_uid: registration.ticket_uid } })).status, 403, 'Members cannot perform Finance/Admin check-in actions');
    assert.equal((await request(baseUrl, '/admin/content/events/check-in', { method: 'POST', token: admin.token, body: { event_id: concurrentEvent.id, ticket_uid: registration.ticket_uid } })).status, 409, 'A ticket cannot be used to check in to a different event');
    assert.equal((await request(baseUrl, '/admin/content/events/check-in', { method: 'POST', token: admin.token, body: { event_id: publishedEvent.id, ticket_uid: registration.ticket_uid } })).status, 200, 'Authorized event staff can check in a confirmed free-event ticket to its event');
    const checkedInRegistration = await EventRegistration.findByPk(registration.id);
    assert.equal(String(checkedInRegistration.checked_in_by), String(admin.user.id), 'Successful check-in records the authorized staff member');
    assert.equal((await request(baseUrl, '/admin/content/events/check-in', { method: 'POST', token: admin.token, body: { event_id: publishedEvent.id, ticket_uid: registration.ticket_uid } })).status, 409, 'Duplicate ticket check-in is rejected');
    const secondMemberRegistration = await request(baseUrl, `/membership/events/${publishedEvent.id}/registrations`, { method: 'POST', token: memberTwo.token });
    assert.equal(secondMemberRegistration.status, 201, 'A different member may independently register for the same event');

    const duplicateRegistration = await request(baseUrl, `/membership/events/${publishedEvent.id}/registrations`, { method: 'POST', token: memberOne.token });
    assert.equal(duplicateRegistration.status, 409, 'Rejects duplicate member/event registration');
    assert.equal(duplicateRegistration.body.code, 'ALREADY_REGISTERED', 'Duplicate response uses a stable code');

    const concurrentResults = await Promise.all([
      request(baseUrl, `/membership/events/${concurrentEvent.id}/registrations`, { method: 'POST', token: memberOne.token }),
      request(baseUrl, `/membership/events/${concurrentEvent.id}/registrations`, { method: 'POST', token: memberOne.token }),
    ]);
    assert.deepEqual(concurrentResults.map(({ status }) => status).sort(), [201, 409], 'Concurrent duplicate requests create one registration');
    assert.equal(await EventRegistration.count({ where: { event_id: concurrentEvent.id, user_id: memberOne.user.id } }), 1, 'Database uniqueness constraint stores one concurrent registration');

    const capacityResults = await Promise.all([
      request(baseUrl, `/membership/events/${limitedEvent.id}/registrations`, { method: 'POST', token: memberOne.token }),
      request(baseUrl, `/membership/events/${limitedEvent.id}/registrations`, { method: 'POST', token: memberTwo.token }),
    ]);
    assert.deepEqual(capacityResults.map(({ status }) => status).sort(), [201, 409], 'Capacity is enforced under concurrent registration requests');
    assert.ok(capacityResults.some(({ body }) => body.code === 'EVENT_FULL'), 'Capacity overflow returns a stable EVENT_FULL code');

    const paidRegistrationResponse = await request(baseUrl, `/membership/events/${paidEvent.id}/registrations`, { method: 'POST', token: memberOne.token });
    assert.equal(paidRegistrationResponse.status, 201, 'Paid event creates a payable registration');
    assert.equal(paidRegistrationResponse.body.data.registration.status, 'AWAITING_PAYMENT', 'Paid registration is not confirmed before payment');
    assert.equal(paidRegistrationResponse.body.data.registration.payment_status, 'AWAITING_PAYMENT', 'Paid event exposes a separate payment status');
    const paidRegistration = await EventRegistration.findByPk(paidRegistrationResponse.body.data.registration.id);
    const eventPayment = await Payment.findOne({ where: { event_registration_id: paidRegistration.id } });
    const eventInvoice = await Invoice.findOne({ where: { event_registration_id: paidRegistration.id } });
    assert.ok(eventPayment && eventInvoice, 'Paid registration creates one payment record and invoice');
    assert.equal(Number(eventPayment.amount), 80, 'Authenticated members are charged the configured member price');
    assert.equal(paidRegistration.ticket_uid, null, 'Paid registrations do not receive a ticket before payment approval');
    assert.equal(eventPayment.purpose, 'EVENT', 'Payment purpose is explicit');
    const repeatedPaidRegistration = await request(baseUrl, `/membership/events/${paidEvent.id}/registrations`, { method: 'POST', token: memberOne.token });
    assert.equal(repeatedPaidRegistration.status, 409, 'Paid event duplicate is rejected');
    assert.equal(await Payment.count({ where: { event_registration_id: paidRegistration.id } }), 1, 'Duplicate request does not create a second event payment');

    assert.equal((await request(baseUrl, `/admin/payments/${eventPayment.id}/verify`, { method: 'PATCH', token: memberOne.token, body: {} })).status, 403, 'Members cannot verify their own event payments');
    const transfer = new FormData();
    transfer.append('payment_method', 'PAYNOW');
    transfer.append('transaction_reference', `EVENT-${unique}`);
    transfer.append('amount', '80.00');
    transfer.append('transfer_date', new Date().toISOString().slice(0, 10));
    transfer.append('proof', new Blob([Buffer.from('%PDF-1.4\nWISTA event payment test proof\n%%EOF')], { type: 'application/pdf' }), 'event-payment-test.pdf');
    const submissionResponse = await fetch(`${baseUrl}/payments/${eventPayment.id}/submit`, { method: 'POST', headers: { Authorization: `Bearer ${memberOne.token}` }, body: transfer });
    const submissionBody = await submissionResponse.json();
    assert.equal(submissionResponse.status, 200, 'Member can submit manual event payment proof');
    const submittedPayment = await Payment.findByPk(eventPayment.id);
    const submission = await PaymentSubmission.findOne({ where: { payment_id: eventPayment.id }, order: [['created_at', 'DESC']] });
    assert.equal(submittedPayment.payment_status, 'SUBMITTED', 'Submission remains awaiting Finance verification');
    assert.equal(submission.status, 'SUBMITTED', 'Proof submission is recorded separately');
    createdProofPaths.push(path.resolve(process.env.PAYMENT_DOCUMENT_STORAGE_PATH || path.join(__dirname, '../../private/payment-proofs'), submission.proof_storage_key));
    const verificationResponse = await request(baseUrl, `/admin/payments/${eventPayment.id}/verify`, { method: 'PATCH', token: finance.token, body: {} });
    assert.equal(verificationResponse.status, 200, 'Finance can verify an event payment with submitted proof');
    const confirmedRegistration = await EventRegistration.findByPk(paidRegistration.id);
    assert.equal(confirmedRegistration.status, 'REGISTERED', 'Finance verification confirms the paid registration');
    assert.equal(confirmedRegistration.payment_status, 'PAID', 'Finance verification updates the event payment state');
    assert.match(confirmedRegistration.ticket_uid, /^[0-9a-f-]{36}$/i, 'Finance verification creates the paid-event ticket UID');
    const generatedTicket = confirmedRegistration.ticket_uid;
    assert.equal((await Invoice.findByPk(eventInvoice.id)).status, 'PAID', 'Finance verification marks the linked invoice as paid');
    assert.equal((await request(baseUrl, `/admin/payments/${eventPayment.id}/verify`, { method: 'PATCH', token: finance.token, body: {} })).status, 200, 'Finance verification can be retried idempotently');
    assert.equal((await EventRegistration.findByPk(paidRegistration.id)).ticket_uid, generatedTicket, 'Retry does not create a new ticket');

    const retryRegistrationResult = await request(baseUrl, `/membership/events/${paidEvent.id}/registrations`, { method: 'POST', token: memberTwo.token });
    assert.equal(retryRegistrationResult.status, 201, 'Another member can register independently for the paid event');
    const retryRegistration = await EventRegistration.findByPk(retryRegistrationResult.body.data.registration.id);
    const retryPayment = await Payment.findOne({ where: { event_registration_id: retryRegistration.id } });
    const makeProof = (reference) => {
      const form = new FormData();
      form.append('payment_method', 'BANK_TRANSFER');
      form.append('transaction_reference', reference);
      form.append('amount', '80.00');
      form.append('transfer_date', new Date().toISOString().slice(0, 10));
      form.append('proof', new Blob([Buffer.from('%PDF-1.4\nWISTA event payment retry test\n%%EOF')], { type: 'application/pdf' }), 'event-payment-retry.pdf');
      return form;
    };
    const firstProofResponse = await fetch(`${baseUrl}/payments/${retryPayment.id}/submit`, { method: 'POST', headers: { Authorization: `Bearer ${memberTwo.token}` }, body: makeProof(`REJECT-${unique}`) });
    assert.equal(firstProofResponse.status, 200, 'Member can submit proof before an event payment rejection');
    let retrySubmission = await PaymentSubmission.findOne({ where: { payment_id: retryPayment.id }, order: [['created_at', 'DESC']] });
    createdProofPaths.push(path.resolve(process.env.PAYMENT_DOCUMENT_STORAGE_PATH || path.join(__dirname, '../../private/payment-proofs'), retrySubmission.proof_storage_key));
    const rejection = await request(baseUrl, `/admin/payments/${retryPayment.id}/reject`, { method: 'PATCH', token: finance.token, body: { failure_reason: 'Transfer reference could not be matched.' } });
    assert.equal(rejection.status, 200, 'Finance can reject an event payment with a reason');
    assert.equal((await EventRegistration.findByPk(retryRegistration.id)).payment_status, 'REJECTED', 'Rejected payment leaves the paid event registration unconfirmed');
    assert.equal((await PaymentSubmission.findByPk(retrySubmission.id)).review_reason, 'Transfer reference could not be matched.', 'Member-visible submission history retains Finance feedback');
    const correctedProofResponse = await fetch(`${baseUrl}/payments/${retryPayment.id}/submit`, { method: 'POST', headers: { Authorization: `Bearer ${memberTwo.token}` }, body: makeProof(`RETRY-${unique}`) });
    assert.equal(correctedProofResponse.status, 200, 'Member can submit corrected event payment proof without a second registration or invoice');
    retrySubmission = await PaymentSubmission.findOne({ where: { payment_id: retryPayment.id }, order: [['created_at', 'DESC']] });
    createdProofPaths.push(path.resolve(process.env.PAYMENT_DOCUMENT_STORAGE_PATH || path.join(__dirname, '../../private/payment-proofs'), retrySubmission.proof_storage_key));
    assert.equal(await Payment.count({ where: { event_registration_id: retryRegistration.id } }), 1, 'Payment retry reuses the original event payment');
    assert.equal(await Invoice.count({ where: { event_registration_id: retryRegistration.id } }), 1, 'Payment retry reuses the original event invoice');
    assert.equal((await request(baseUrl, `/admin/payments/${retryPayment.id}/verify`, { method: 'PATCH', token: finance.token, body: {} })).status, 200, 'Finance can verify corrected event payment proof');
    assert.equal((await EventRegistration.findByPk(retryRegistration.id)).payment_status, 'PAID', 'Corrected payment verification confirms the registration');
    const unpricedRegistration = await request(baseUrl, `/membership/events/${unpricedEvent.id}/registrations`, { method: 'POST', token: memberTwo.token });
    assert.equal(unpricedRegistration.status, 409, 'Paid event without a configured applicable price is blocked');
    assert.equal(unpricedRegistration.body.code, 'EVENT_PRICE_NOT_CONFIGURED', 'Unpriced event returns an actionable API code');

    const memberHistory = await request(baseUrl, '/membership/events/registrations/me', { token: memberOne.token });
    assert.equal(memberHistory.status, 200, 'Member can retrieve their own registration history');
    assert.ok(memberHistory.body.data.registrations.some(({ event_id }) => String(event_id) === String(publishedEvent.id)), 'History contains the member registration');
    const publishedRegistration = memberHistory.body.data.registrations.find(({ event_id }) => String(event_id) === String(publishedEvent.id));
    assert.equal(publishedRegistration.event.title, publishedEvent.title, 'History contains the actual associated event record');
    const otherMemberHistory = await request(baseUrl, `/membership/events/registrations/me?user_id=${memberOne.user.id}`, { token: memberTwo.token });
    const otherMemberRegistrationIds = otherMemberHistory.body.data.registrations.map(({ id }) => String(id));
    assert.ok(otherMemberRegistrationIds.includes(String(secondMemberRegistration.body.data.registration.id)), 'Member history includes the second member own registration');
    assert.ok(!otherMemberRegistrationIds.includes(String(registration.id)), 'Another member cannot read the first member registration, even with a user_id query');

    const missingEvent = await request(baseUrl, '/membership/events/999999999/registrations', { method: 'POST', token: memberOne.token });
    assert.equal(missingEvent.status, 404, 'Rejects a nonexistent event');
    for (const [event, label] of [[draftEvent, 'unpublished'], [cancelledEvent, 'cancelled'], [pastEvent, 'past']]) {
      const ineligible = await request(baseUrl, `/membership/events/${event.id}/registrations`, { method: 'POST', token: memberOne.token });
      assert.equal(ineligible.status, 409, `Rejects a ${label} event`);
      assert.equal(ineligible.body.code, 'EVENT_NOT_OPEN', `Returns the event eligibility status for ${label} events`);
    }

    const registrationAudit = await AuditLog.findAll({ where: { action: 'EVENT_REGISTERED', entity_type: 'event_registration', user_id: memberOne.user.id } });
    const expectedMemberOneRegistrationAudits = 2 + Number(concurrentResults.some(({ status }) => status === 201)) + Number(capacityResults[0].status === 201);
    assert.equal(registrationAudit.length, expectedMemberOneRegistrationAudits, 'Writes one audit record for each successful registration and none for rejected duplicates');
    assert.ok(registrationAudit.every(({ new_values: values }) => ['REGISTERED', 'AWAITING_PAYMENT'].includes(values?.status) && ['NOT_REQUIRED', 'AWAITING_PAYMENT'].includes(values?.payment_status)), 'Audit records registration and separate payment states');

    console.log('Event workflow integration checks passed: Admin create/edit permissions, registration capacity, public compatibility, published details, event-bound check-in, member pricing, manual proof submission, Finance rejection and corrected resubmission, idempotent verification and ticket generation, member-specific history, RBAC, and audit logging.');
  } finally {
    if (createdEventIds.length && createdUserIds.length) {
      const rows = await EventRegistration.findAll({
        where: { event_id: createdEventIds, user_id: createdUserIds },
        attributes: ['id'],
      });
      const registrationIds = rows.map(({ id }) => id);
      if (registrationIds.length) {
        await AuditLog.destroy({ where: { entity_type: 'event_registration', entity_id: registrationIds.map(String) } });
        const payments = await Payment.findAll({ where: { event_registration_id: registrationIds }, attributes: ['id'] });
        const paymentIds = payments.map(({ id }) => id);
        if (paymentIds.length) await Invoice.destroy({ where: { payment_id: paymentIds } });
        if (paymentIds.length) await Payment.destroy({ where: { id: paymentIds } });
        await EventRegistration.destroy({ where: { id: registrationIds } });
      }
    }
    await Promise.all(createdProofPaths.map((proofPath) => fs.unlink(proofPath).catch((error) => { if (error.code !== 'ENOENT') throw error; })));
    if (createdEventIds.length) {
      await AuditLog.destroy({ where: { module: 'events', entity_type: 'event', entity_id: createdEventIds.map(String) } });
      await Event.destroy({ where: { id: createdEventIds } });
    }
    if (createdUserIds.length) {
      await AuditLog.destroy({ where: { user_id: createdUserIds } });
      await User.destroy({ where: { id: createdUserIds } });
    }
    if (createdEventIds.length) assert.equal(await Event.count({ where: { id: createdEventIds } }), 0, 'Cleans up only events created by this suite');
    if (createdEventIds.length) assert.equal(await EventRegistration.count({ where: { event_id: createdEventIds } }), 0, 'Cleans up only registrations created by this suite');
    if (createdUserIds.length) assert.equal(await User.count({ where: { id: createdUserIds } }), 0, 'Cleans up only users created by this suite');
    if (createdUserIds.length) assert.equal(await AuditLog.count({ where: { user_id: createdUserIds } }), 0, 'Cleans up only audit records created by this suite');
    if (createdEventIds.length) assert.equal(await AuditLog.count({ where: { entity_type: 'event', entity_id: createdEventIds.map(String) } }), 0, 'Cleans up the Admin event audit records created by this suite');
    if (server) await new Promise((resolve) => server.close(resolve));
    await sequelize.close();
  }
};

run().catch((error) => {
  console.error('Event workflow integration checks failed:', error.message);
  process.exitCode = 1;
});
