'use strict';

const { Event, EventRegistration, AuditLog, Membership, Payment, Invoice, sequelize } = require('../models');
const { randomUUID } = require('node:crypto');
const { generatePaymentReference, generateInvoiceNumber } = require('../utils/referenceGenerator');

const EVENT_ATTRIBUTES = ['id', 'title', 'description', 'event_type', 'location', 'starts_at', 'ends_at', 'status', 'is_free', 'member_price', 'non_member_price'];

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
        { model: require('../models').User, as: 'member', attributes: ['id', 'email', 'first_name', 'last_name'] },
      ],
      order: [['created_at', 'DESC']],
    });
    return res.json({ success: true, data: { registrations } });
  } catch (error) { return next(error); }
};

const checkInEventRegistration = async (req, res, next) => {
  const ticketUid = typeof req.body?.ticket_uid === 'string' ? req.body.ticket_uid.trim() : '';
  if (!ticketUid || ticketUid.length > 64) return res.status(400).json({ success: false, message: 'Enter a valid ticket UID.' });
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const registration = await EventRegistration.findOne({ where: { ticket_uid: ticketUid }, transaction, lock: transaction.LOCK.UPDATE });
    if (!registration) { await transaction.rollback(); return res.status(404).json({ success: false, message: 'Ticket not found.' }); }
    if (registration.checked_in_at) { await transaction.rollback(); return res.status(409).json({ success: false, message: 'This ticket has already been checked in.' }); }
    if (!['NOT_REQUIRED', 'PAID'].includes(registration.payment_status) || registration.status !== 'REGISTERED') {
      await transaction.rollback(); return res.status(409).json({ success: false, message: 'This registration is not confirmed for entry.' });
    }
    registration.checked_in_at = new Date();
    await registration.save({ transaction });
    await AuditLog.create({
      user_id: req.user.id, action: 'EVENT_ATTENDEE_CHECKED_IN', module: 'events',
      entity_type: 'event_registration', entity_id: String(registration.id),
      new_values: { ticket_uid: registration.ticket_uid, checked_in_at: registration.checked_in_at },
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
    if (event.status !== 'PUBLISHED' || new Date(event.starts_at).getTime() <= Date.now()) {
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

    const activeMembership = await Membership.findOne({ where: { user_id: req.user.id, status: 'ACTIVE' }, transaction });
    const isFree = event.is_free === true || event.is_free === 1;
    const configuredPrice = Number(activeMembership ? event.member_price : event.non_member_price);
    if (!isFree && (!Number.isFinite(configuredPrice) || configuredPrice <= 0)) {
      await transaction.rollback();
      return res.status(409).json({ success: false, code: 'EVENT_PRICE_NOT_CONFIGURED', message: `A valid ${activeMembership ? 'member' : 'non-member'} price is not configured for this event. Please contact the event organizer.` });
    }
    const registration = await EventRegistration.create({
      event_id: event.id,
      user_id: req.user.id,
      status: isFree ? 'REGISTERED' : 'AWAITING_PAYMENT',
      payment_status: isFree ? 'NOT_REQUIRED' : 'AWAITING_PAYMENT',
      amount_due: isFree ? 0 : configuredPrice,
      currency: 'SGD',
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
        user_id: req.user.id, purpose: 'EVENT', amount: configuredPrice, currency: 'SGD',
        payment_method: 'BANK_TRANSFER', payment_status: 'PENDING',
      }, { transaction });
      invoice = await Invoice.create({
        invoice_number: invoiceNumber, payment_id: payment.id, event_registration_id: registration.id,
        user_id: req.user.id, membership_type: activeMembership?.membership_type || null,
        description: `Event registration: ${event.title}`, subtotal: configuredPrice, discount: 0,
        total: configuredPrice, currency: 'SGD', status: 'ISSUED', issued_at: new Date(), due_at: dueAt,
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
