'use strict';

const { Event, EventRegistration, AuditLog, Payment, Invoice, User, sequelize } = require('../models');
const { randomUUID } = require('node:crypto');
const { generatePaymentReference, generateInvoiceNumber } = require('../utils/referenceGenerator');

const EVENT_ATTRIBUTES = ['id', 'title', 'description', 'event_type', 'location', 'image_url', 'format', 'starts_at', 'ends_at', 'registration_opens_at', 'registration_closes_at', 'capacity', 'currency', 'status', 'is_free', 'member_price'];

const listMyEventRegistrations = async (req, res, next) => {
  try {
    const registrations = await EventRegistration.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: Event, as: 'event', attributes: EVENT_ATTRIBUTES },
        { model: Payment, as: 'payment', attributes: ['id', 'payment_reference', 'amount', 'currency', 'payment_status'] },
        { model: Invoice, as: 'invoice', attributes: ['id', 'invoice_number', 'total', 'currency', 'due_at', 'status'] },
      ],
      order: [['created_at', 'DESC'], ['id', 'DESC']],
    });
    return res.json({ success: true, data: { registrations } });
  } catch (error) {
    return next(error);
  }
};

const listAdminEventRegistrations = async (req, res, next) => {
  try {
    const registrations = await EventRegistration.findAll({
      where: { event_id: req.params.eventId },
      include: [
        { model: Event, as: 'event', attributes: ['id', 'title', 'starts_at', 'location'] },
        { model: User, as: 'member', attributes: ['id', 'email', 'first_name', 'last_name'] },
        { model: User, as: 'checkedInBy', attributes: ['id', 'email', 'first_name', 'last_name'], required: false },
      ],
      order: [['created_at', 'DESC']],
    });
    return res.json({ success: true, data: { registrations } });
  } catch (error) { return next(error); }
};

const checkInEventRegistration = async (req, res, next) => {
  const ticketUid = typeof req.body?.ticket_uid === 'string' ? req.body.ticket_uid.trim() : '';
  const eventId = String(req.body?.event_id || '');
  if (!ticketUid || ticketUid.length > 64) return res.status(400).json({ success: false, message: 'Enter a valid ticket UID.' });
  if (!/^\d+$/.test(eventId) || BigInt(eventId) <= 0n) return res.status(400).json({ success: false, message: 'Select a valid event before checking in a ticket.' });
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const registration = await EventRegistration.findOne({ where: { ticket_uid: ticketUid }, transaction, lock: transaction.LOCK.UPDATE });
    if (!registration) { await transaction.rollback(); return res.status(404).json({ success: false, message: 'Ticket not found.' }); }
    if (String(registration.event_id) !== eventId) { await transaction.rollback(); return res.status(409).json({ success: false, message: 'This ticket belongs to a different event.' }); }
    const event = await Event.findByPk(eventId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!event || event.status === 'CANCELLED') { await transaction.rollback(); return res.status(409).json({ success: false, message: 'This event is not eligible for check-in.' }); }
    if (registration.checked_in_at) { await transaction.rollback(); return res.status(409).json({ success: false, message: 'This ticket has already been checked in.' }); }
    if (!['NOT_REQUIRED', 'PAID'].includes(registration.payment_status) || registration.status !== 'REGISTERED') {
      await transaction.rollback(); return res.status(409).json({ success: false, message: 'This registration is not confirmed for entry.' });
    }
    registration.checked_in_at = new Date();
    registration.checked_in_by = req.user.id;
    await registration.save({ transaction });
    await AuditLog.create({
      user_id: req.user.id, action: 'EVENT_ATTENDEE_CHECKED_IN', module: 'events',
      entity_type: 'event_registration', entity_id: String(registration.id),
      new_values: { event_id: registration.event_id, ticket_uid: registration.ticket_uid, checked_in_at: registration.checked_in_at, checked_in_by: req.user.id },
      ip_address: req.ip, user_agent: String(req.get('user-agent') || '').slice(0, 500),
    }, { transaction });
    await transaction.commit();
    return res.json({ success: true, message: 'Attendee checked in.', data: { registration } });
  } catch (error) { if (transaction && !transaction.finished) await transaction.rollback(); return next(error); }
};

const registerForEvent = async (req, res, next) => {
  const eventId = String(req.params.eventId || '');
  if (!/^\d+$/.test(eventId) || BigInt(eventId) <= 0n) {
    return res.status(404).json({ success: false, code: 'EVENT_NOT_FOUND', message: 'Event not found.' });
  }

  let transaction;
  try {
    transaction = await sequelize.transaction();
    const event = await Event.findByPk(eventId, {
      attributes: EVENT_ATTRIBUTES,
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!event) {
      await transaction.rollback();
      return res.status(404).json({ success: false, code: 'EVENT_NOT_FOUND', message: 'Event not found.' });
    }
    const now = Date.now();
    const opensAt = event.registration_opens_at ? new Date(event.registration_opens_at).getTime() : -Infinity;
    const closesAt = event.registration_closes_at ? new Date(event.registration_closes_at).getTime() : new Date(event.starts_at).getTime();
    if (event.status !== 'PUBLISHED' || now < opensAt || now >= closesAt || now >= new Date(event.starts_at).getTime()) {
      await transaction.rollback();
      return res.status(409).json({ success: false, code: 'EVENT_NOT_OPEN', message: 'This event is not open for registration.' });
    }

    const existing = await EventRegistration.findOne({
      where: { event_id: event.id, user_id: req.user.id },
      transaction,
    });
    if (existing) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        code: 'ALREADY_REGISTERED',
        message: 'You are already registered for this event.',
        data: { registration: { id: existing.id, event_id: existing.event_id, status: existing.status, created_at: existing.created_at } },
      });
    }

    const isFree = event.is_free === true || event.is_free === 1;
    const configuredPrice = Number(event.member_price);
    if (!isFree && (!Number.isFinite(configuredPrice) || configuredPrice <= 0)) {
      await transaction.rollback();
      return res.status(409).json({ success: false, code: 'EVENT_PRICE_NOT_CONFIGURED', message: 'A valid member price is not configured for this event. Please contact the event organizer.' });
    }
    const registrationCount = await EventRegistration.count({ where: { event_id: event.id }, transaction });
    if (event.capacity !== null && registrationCount >= Number(event.capacity)) {
      await transaction.rollback();
      return res.status(409).json({ success: false, code: 'EVENT_FULL', message: 'This event has reached its registration capacity.' });
    }
    const registration = await EventRegistration.create({
      event_id: event.id,
      user_id: req.user.id,
      status: isFree ? 'REGISTERED' : 'AWAITING_PAYMENT',
      payment_status: isFree ? 'NOT_REQUIRED' : 'AWAITING_PAYMENT',
      amount_due: isFree ? 0 : configuredPrice,
      currency: event.currency || 'SGD',
      ticket_uid: isFree ? randomUUID() : null,
    }, { transaction });
    let payment = null;
    let invoice = null;
    if (!isFree) {
      const paymentReference = await generatePaymentReference();
      const invoiceNumber = await generateInvoiceNumber();
      const dueAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      payment = await Payment.create({
        payment_reference: paymentReference, event_registration_id: registration.id,
        user_id: req.user.id, purpose: 'EVENT', amount: configuredPrice, currency: event.currency || 'SGD',
        payment_method: 'BANK_TRANSFER', payment_status: 'PENDING',
      }, { transaction });
      invoice = await Invoice.create({
        invoice_number: invoiceNumber, payment_id: payment.id, event_registration_id: registration.id,
        user_id: req.user.id, membership_type: null,
        description: `Event registration: ${event.title}`, subtotal: configuredPrice, discount: 0,
        total: configuredPrice, currency: event.currency || 'SGD', status: 'ISSUED', issued_at: new Date(), due_at: dueAt,
      }, { transaction });
    }
    await AuditLog.create({
      user_id: req.user.id,
      action: 'EVENT_REGISTERED',
      module: 'events',
      entity_type: 'event_registration',
      entity_id: String(registration.id),
      new_values: { event_id: String(event.id), status: registration.status, payment_status: registration.payment_status, amount_due: registration.amount_due },
      ip_address: req.ip,
      user_agent: String(req.get('user-agent') || '').slice(0, 500),
    }, { transaction });
    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: isFree ? 'You are registered for this event.' : 'Registration started. Complete payment using the invoice in Member Portal → Payments.',
      data: { registration: { id: registration.id, event_id: registration.event_id, status: registration.status, payment_status: registration.payment_status, ticket_uid: registration.ticket_uid, payment, invoice, created_at: registration.created_at } },
    });
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, code: 'ALREADY_REGISTERED', message: 'You are already registered for this event.' });
    }
    return next(error);
  }
};

module.exports = { listMyEventRegistrations, registerForEvent, listAdminEventRegistrations, checkInEventRegistration };
