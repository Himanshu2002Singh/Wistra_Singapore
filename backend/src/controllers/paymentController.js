'use strict';

const {
  sequelize,
  Payment,
  Invoice,
  MembershipApplication,
  User,
  AuditLog,
} = require('../models');
const { calculateMembershipFee } = require('../services/feeCalculationService');
const { generatePaymentReference, generateInvoiceNumber } = require('../utils/referenceGenerator');
const { Op } = require('sequelize');

/**
 * Create a new Payment request & Invoice for an approved application.
 */
const createPayment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { application_id, payment_method, discount } = req.body;

    if (!application_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'application_id is required.',
      });
    }

    // Retrieve application and verify ownership & status
    const application = await MembershipApplication.findOne({
      where: { id: application_id, user_id: userId },
      transaction,
    });

    if (!application) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Application not found or does not belong to you.',
      });
    }

    if (!['PAYMENT_PENDING', 'APPROVED'].includes(application.status)) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: `Cannot create payment for application in status '${application.status}'. Application must be approved first.`,
      });
    }

    // Check for existing active payment
    const existingPayment = await Payment.findOne({
      where: {
        application_id,
        payment_status: {
          [Op.in]: ['PENDING', 'SUBMITTED', 'UNDER_VERIFICATION', 'PAID'],
        },
      },
      transaction,
    });

    if (existingPayment) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: `An active payment already exists (${existingPayment.payment_reference}) with status '${existingPayment.payment_status}'.`,
        data: existingPayment,
      });
    }

    // Server-side fee calculation
    const feeDetails = calculateMembershipFee({
      membershipType: application.membership_type,
      discount: discount || 0,
    });

    const paymentRef = await generatePaymentReference();
    const invoiceNum = await generateInvoiceNumber();

    const selectedMethod = ['BANK_TRANSFER', 'PAYNOW', 'CARD', 'OTHER'].includes(payment_method)
      ? payment_method
      : 'BANK_TRANSFER';

    // Create Payment Record
    const payment = await Payment.create(
      {
        payment_reference: paymentRef,
        application_id,
        user_id: userId,
        amount: feeDetails.total,
        currency: feeDetails.currency,
        payment_method: selectedMethod,
        payment_status: 'PENDING',
      },
      { transaction }
    );

    // Create Invoice Record
    const invoice = await Invoice.create(
      {
        invoice_number: invoiceNum,
        payment_id: payment.id,
        application_id,
        user_id: userId,
        membership_type: application.membership_type,
        subtotal: feeDetails.subtotal,
        discount: feeDetails.discount,
        total: feeDetails.total,
        currency: feeDetails.currency,
        status: 'ISSUED',
        issued_at: new Date(),
        due_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days due
      },
      { transaction }
    );

    // Audit logs
    await AuditLog.create(
      {
        user_id: userId,
        action: 'PAYMENT_CREATED',
        module: 'PAYMENT',
        entity_type: 'Payment',
        entity_id: String(payment.id),
        new_values: { payment_reference: paymentRef, amount: feeDetails.total, method: selectedMethod },
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
      },
      { transaction }
    );

    await AuditLog.create(
      {
        user_id: userId,
        action: 'INVOICE_CREATED',
        module: 'INVOICE',
        entity_type: 'Invoice',
        entity_id: String(invoice.id),
        new_values: { invoice_number: invoiceNum, total: feeDetails.total },
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: 'Payment request and invoice created successfully.',
      data: {
        payment,
        invoice,
      },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Submit manual payment details (PayNow / Bank Transfer reference).
 */
const submitPaymentDetails = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { payment_method, transaction_reference, notes } = req.body;

    const payment = await Payment.findOne({
      where: { id, user_id: userId },
      transaction,
    });

    if (!payment) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Payment record not found or access denied.',
      });
    }

    if (!['PENDING', 'SUBMITTED'].includes(payment.payment_status)) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: `Cannot submit payment details for payment in status '${payment.payment_status}'.`,
      });
    }

    const oldStatus = payment.payment_status;
    if (payment_method && ['BANK_TRANSFER', 'PAYNOW', 'CARD', 'OTHER'].includes(payment_method)) {
      payment.payment_method = payment_method;
    }
    if (transaction_reference) {
      payment.transaction_reference = transaction_reference.trim();
    }
    if (notes) {
      payment.notes = notes.trim();
    }
    payment.payment_status = 'SUBMITTED';
    await payment.save({ transaction });

    await AuditLog.create(
      {
        user_id: userId,
        action: 'PAYMENT_SUBMITTED',
        module: 'PAYMENT',
        entity_type: 'Payment',
        entity_id: String(payment.id),
        old_values: { status: oldStatus },
        new_values: {
          status: 'SUBMITTED',
          transaction_reference: payment.transaction_reference,
          payment_method: payment.payment_method,
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
      },
      { transaction }
    );

    await transaction.commit();

    return res.json({
      success: true,
      message: 'Payment details submitted successfully. Pending Finance Admin verification.',
      data: payment,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Get authenticated user's payments.
 */
const getMyPayments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const payments = await Payment.findAll({
      where: { user_id: userId },
      include: [
        { model: Invoice, as: 'invoice' },
        { model: MembershipApplication, as: 'application' },
      ],
      order: [['created_at', 'DESC']],
    });

    return res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get invoice details by ID (with IDOR protection).
 */
const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'first_name', 'last_name', 'phone'] },
        { model: Payment, as: 'payment' },
        { model: MembershipApplication, as: 'application' },
      ],
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found.',
      });
    }

    const isOwner = String(invoice.user_id) === String(req.user.id);
    const roleName = req.user.role?.name || req.user.role;
    const userPermissions = req.user.permissions || [];
    const canReadAllInvoices = roleName === 'SUPER_ADMIN'
      || userPermissions.includes('invoices.read')
      || userPermissions.includes('invoices.manage');
    if (!isOwner && !canReadAllInvoices) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this invoice.',
      });
    }

    return res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Administrative: List all payments with filtering & search.
 */
const getAdminPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const { status, payment_method, search } = req.query;
    const where = {};

    if (status) where.payment_status = status;
    if (payment_method) where.payment_method = payment_method;

    if (search) {
      where[Op.or] = [
        { payment_reference: { [Op.like]: `%${search}%` } },
        { transaction_reference: { [Op.like]: `%${search}%` } },
        { '$user.email$': { [Op.like]: `%${search}%` } },
        { '$user.first_name$': { [Op.like]: `%${search}%` } },
        { '$user.last_name$': { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: payments } = await Payment.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'first_name', 'last_name', 'phone'] },
        { model: User, as: 'verifier', attributes: ['id', 'email', 'first_name', 'last_name'] },
        { model: Invoice, as: 'invoice' },
        { model: MembershipApplication, as: 'application' },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return res.json({
      success: true,
      data: {
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        payments,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Administrative: Get payment details by ID.
 */
const getAdminPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'first_name', 'last_name', 'phone'] },
        { model: User, as: 'verifier', attributes: ['id', 'email', 'first_name', 'last_name'] },
        { model: Invoice, as: 'invoice' },
        { model: MembershipApplication, as: 'application' },
      ],
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found.',
      });
    }

    return res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Administrative: Verify payment (Transitions status to PAID).
 * NOTE: Does NOT activate membership. Prepares application for STEP 8 activation.
 */
const verifyPayment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { notes, transaction_reference } = req.body;

    const payment = await Payment.findByPk(id, { transaction });
    if (!payment) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (['PAID', 'REFUNDED', 'CANCELLED'].includes(payment.payment_status)) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: `Payment is already in status '${payment.payment_status}'. Cannot verify.`,
      });
    }

    const oldStatus = payment.payment_status;
    const now = new Date();

    payment.payment_status = 'PAID';
    payment.verified_by = req.user.id;
    payment.verified_at = now;
    payment.paid_at = payment.paid_at || now;
    if (transaction_reference) payment.transaction_reference = transaction_reference.trim();
    if (notes) payment.notes = notes.trim();

    await payment.save({ transaction });

    // Update associated Invoice
    const invoice = await Invoice.findOne({ where: { payment_id: payment.id }, transaction });
    if (invoice) {
      invoice.status = 'PAID';
      invoice.paid_at = now;
      await invoice.save({ transaction });
    }

    // Log audit
    await AuditLog.create(
      {
        user_id: req.user.id,
        action: 'PAYMENT_VERIFIED',
        module: 'PAYMENT',
        entity_type: 'Payment',
        entity_id: String(payment.id),
        old_values: { status: oldStatus },
        new_values: { status: 'PAID', verified_by: req.user.id },
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
      },
      { transaction }
    );

    await transaction.commit();

    return res.json({
      success: true,
      message: 'Payment successfully verified and marked as PAID. Application ready for activation.',
      data: {
        payment,
        invoice,
      },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Administrative: Reject payment.
 */
const rejectPayment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { failure_reason, notes } = req.body;

    if (!failure_reason || !failure_reason.trim()) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'failure_reason is required when rejecting a payment.',
      });
    }

    const payment = await Payment.findByPk(id, { transaction });
    if (!payment) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (['PAID', 'REFUNDED'].includes(payment.payment_status)) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: `Cannot reject payment in status '${payment.payment_status}'.`,
      });
    }

    const oldStatus = payment.payment_status;
    payment.payment_status = 'REJECTED';
    payment.failure_reason = failure_reason.trim();
    if (notes) payment.notes = notes.trim();
    await payment.save({ transaction });

    await AuditLog.create(
      {
        user_id: req.user.id,
        action: 'PAYMENT_REJECTED',
        module: 'PAYMENT',
        entity_type: 'Payment',
        entity_id: String(payment.id),
        old_values: { status: oldStatus },
        new_values: { status: 'REJECTED', failure_reason: payment.failure_reason },
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
      },
      { transaction }
    );

    await transaction.commit();

    return res.json({
      success: true,
      message: 'Payment rejected.',
      data: payment,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Administrative: Refund payment.
 */
const refundPayment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const payment = await Payment.findByPk(id, { transaction });
    if (!payment) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (payment.payment_status !== 'PAID') {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: `Only PAID payments can be refunded. Current status is '${payment.payment_status}'.`,
      });
    }

    payment.payment_status = 'REFUNDED';
    if (notes) payment.notes = notes.trim();
    await payment.save({ transaction });

    const invoice = await Invoice.findOne({ where: { payment_id: payment.id }, transaction });
    if (invoice) {
      invoice.status = 'REFUNDED';
      await invoice.save({ transaction });
    }

    await AuditLog.create(
      {
        user_id: req.user.id,
        action: 'PAYMENT_REFUNDED',
        module: 'PAYMENT',
        entity_type: 'Payment',
        entity_id: String(payment.id),
        old_values: { status: 'PAID' },
        new_values: { status: 'REFUNDED' },
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
      },
      { transaction }
    );

    await transaction.commit();

    return res.json({
      success: true,
      message: 'Payment refunded successfully.',
      data: { payment, invoice },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Administrative: Authorize complimentary payment (0.00 SGD).
 */
const createComplimentaryPayment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const adminId = req.user.id;
    const { application_id, notes } = req.body;

    if (!application_id) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'application_id is required.' });
    }

    const application = await MembershipApplication.findByPk(application_id, { transaction });
    if (!application) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (!['PAYMENT_PENDING', 'APPROVED'].includes(application.status)) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: `Cannot issue complimentary payment for application in status '${application.status}'.`,
      });
    }

    const feeDetails = calculateMembershipFee({
      membershipType: application.membership_type,
      isComplimentary: true,
    });

    const paymentRef = await generatePaymentReference();
    const invoiceNum = await generateInvoiceNumber();
    const now = new Date();

    const payment = await Payment.create(
      {
        payment_reference: paymentRef,
        application_id,
        user_id: application.user_id,
        amount: 0.00,
        currency: 'SGD',
        payment_method: 'COMPLIMENTARY',
        payment_status: 'PAID',
        paid_at: now,
        verified_at: now,
        verified_by: adminId,
        notes: notes || 'Complimentary membership authorized by Finance Admin.',
      },
      { transaction }
    );

    const invoice = await Invoice.create(
      {
        invoice_number: invoiceNum,
        payment_id: payment.id,
        application_id,
        user_id: application.user_id,
        membership_type: application.membership_type,
        subtotal: feeDetails.subtotal,
        discount: feeDetails.discount,
        total: 0.00,
        currency: 'SGD',
        status: 'PAID',
        issued_at: now,
        paid_at: now,
      },
      { transaction }
    );

    await AuditLog.create(
      {
        user_id: adminId,
        action: 'COMPLIMENTARY_PAYMENT_CREATED',
        module: 'PAYMENT',
        entity_type: 'Payment',
        entity_id: String(payment.id),
        new_values: { payment_reference: paymentRef, amount: 0.00, authorized_by: adminId },
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: 'Complimentary payment record & invoice created and marked as PAID.',
      data: { payment, invoice },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

module.exports = {
  createPayment,
  submitPaymentDetails,
  getMyPayments,
  getInvoiceById,
  getAdminPayments,
  getAdminPaymentById,
  verifyPayment,
  rejectPayment,
  refundPayment,
  createComplimentaryPayment,
};
