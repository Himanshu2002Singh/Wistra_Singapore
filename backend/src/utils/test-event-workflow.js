'use strict';

require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const app = require('../app');
const { sequelize, User, Role, Event, EventRegistration, Payment, Invoice, AuditLog } = require('../models');
const { hashPassword } = require('./password');
const { generateToken } = require('./jwt');

const createdUserIds = [];
const createdEventIds = [];
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
    const memberOne = await actor('MEMBER', `event-member-one-${unique}@example.invalid`);
    const memberTwo = await actor('MEMBER', `event-member-two-${unique}@example.invalid`);
    const future = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const past = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const eventInput = (title, starts_at, status) => ({
      title, description: `${title} database integration event.`, event_type: 'Forum', location: 'Singapore', starts_at, status,
    });

    const publishedEvent = await createEvent(baseUrl, admin.token, eventInput(`Published Event ${unique}`, future(2), 'PUBLISHED'));
    const concurrentEvent = await createEvent(baseUrl, admin.token, eventInput(`Concurrent Event ${unique}`, future(3), 'PUBLISHED'));
    const paidEvent = await createEvent(baseUrl, admin.token, { ...eventInput(`Paid Event ${unique}`, future(4), 'PUBLISHED'), is_free: false, member_price: 80, non_member_price: 100 });
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
    assert.equal((await request(baseUrl, '/admin/content/events/check-in', { method: 'POST', token: admin.token, body: { ticket_uid: registration.ticket_uid } })).status, 200, 'Authorized event staff can check in a confirmed free-event ticket');
    assert.equal((await request(baseUrl, '/admin/content/events/check-in', { method: 'POST', token: admin.token, body: { ticket_uid: registration.ticket_uid } })).status, 409, 'Duplicate ticket check-in is rejected');
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

    const paidRegistrationResponse = await request(baseUrl, `/membership/events/${paidEvent.id}/registrations`, { method: 'POST', token: memberOne.token });
    assert.equal(paidRegistrationResponse.status, 201, 'Paid event creates a payable registration');
    assert.equal(paidRegistrationResponse.body.data.registration.status, 'AWAITING_PAYMENT', 'Paid registration is not confirmed before payment');
    assert.equal(paidRegistrationResponse.body.data.registration.payment_status, 'AWAITING_PAYMENT', 'Paid event exposes a separate payment status');
    const paidRegistration = await EventRegistration.findByPk(paidRegistrationResponse.body.data.registration.id);
    const eventPayment = await Payment.findOne({ where: { event_registration_id: paidRegistration.id } });
    const eventInvoice = await Invoice.findOne({ where: { event_registration_id: paidRegistration.id } });
    assert.ok(eventPayment && eventInvoice, 'Paid registration creates one payment record and invoice');
    assert.equal(Number(eventPayment.amount), 100, 'Unactivated member account uses the explicitly configured non-member price');
    assert.equal(eventPayment.purpose, 'EVENT', 'Payment purpose is explicit');
    const repeatedPaidRegistration = await request(baseUrl, `/membership/events/${paidEvent.id}/registrations`, { method: 'POST', token: memberOne.token });
    assert.equal(repeatedPaidRegistration.status, 409, 'Paid event duplicate is rejected');
    assert.equal(await Payment.count({ where: { event_registration_id: paidRegistration.id } }), 1, 'Duplicate request does not create a second event payment');
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
    assert.equal(registrationAudit.length, 3, 'Writes one audit record for each successful registration and none for rejected duplicates');
    assert.ok(registrationAudit.every(({ new_values: values }) => ['REGISTERED', 'AWAITING_PAYMENT'].includes(values?.status) && ['NOT_REQUIRED', 'AWAITING_PAYMENT'].includes(values?.payment_status)), 'Audit records registration and separate payment states');

    console.log('Event workflow integration checks passed: Admin/public compatibility, published details, eligibility, authenticated registration, concurrent duplicate protection, member-specific history, RBAC, audit logging, and payment/UID boundaries.');
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
