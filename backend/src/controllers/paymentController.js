'use strict';

const {
  sequelize,
  Payment,
  Invoice,
  Membership,
  MembershipApplication,
  MembershipStatusHistory,
  User,
  AuditLog,
  EventRegistration,
  Event,
} = require('../models');
const { calculateMembershipFee } = require('../services/feeCalculationService');
const { generatePaymentReference, generateInvoiceNumber } = require('../utils/referenceGenerator');
const { Op } = require('sequelize');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { PaymentSubmission } = require('../models');
const { activateMembership } = require('../services/membershipActivationService');

const PAYMENT_STORAGE_DIR = path.resolve(process.env.PAYMENT_DOCUMENT_STORAGE_PATH || path.join(__dirname, '../../private/payment-proofs'));
const OFFICIAL_PAYMENT_DETAILS = Object.freeze({
  accountName: "Women's International Shipping & Trading Association Singapore",
  bankName: 'DBS Bank Ltd',
  accountNumber: '0010696858',
  bankCode: '7171',
  branchCode: '001',
  swiftBic: 'DBSSSGSG',
  bankAddress: '12 Marina Boulevard, DBS Asia Central, Marina Bay Financial Centre Tower 3, Singapore 018982',
  payNowUen: 'S99SS0024D',
  payNowQrPath: path.join(__dirname, '../assets/wista-paynow.jpg'),
});

const paymentSetting = (name, fallback) => process.env[name]?.trim() || fallback;
const getBankPaymentDetails = () => ({
  account_name: paymentSetting('BANK_ACCOUNT_NAME', OFFICIAL_PAYMENT_DETAILS.accountName),
  bank_name: paymentSetting('BANK_NAME', OFFICIAL_PAYMENT_DETAILS.bankName),
  account_number: paymentSetting('BANK_ACCOUNT_NUMBER', OFFICIAL_PAYMENT_DETAILS.accountNumber),
  bank_code: paymentSetting('BANK_CODE', OFFICIAL_PAYMENT_DETAILS.bankCode),
  branch_code: paymentSetting('BANK_BRANCH_CODE', OFFICIAL_PAYMENT_DETAILS.branchCode),
  swift_bic: paymentSetting('BANK_SWIFT_BIC', OFFICIAL_PAYMENT_DETAILS.swiftBic),
  address: paymentSetting('BANK_ADDRESS', OFFICIAL_PAYMENT_DETAILS.bankAddress),
});
const getPayNowPaymentDetails = () => ({
  uen: paymentSetting('PAYNOW_UEN', OFFICIAL_PAYMENT_DETAILS.payNowUen),
  qrPath: paymentSetting('PAYNOW_QR_IMAGE_PATH', OFFICIAL_PAYMENT_DETAILS.payNowQrPath),
});

/**
 * Create a new Payment request & Invoice for an approved application.
 */
const createPayment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { application_id } = req.body;

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
      discount: 0,
    });

    const paymentRef = await generatePaymentReference();
    const invoiceNum = await generateInvoiceNumber();

    const selectedMethod = 'BANK_TRANSFER';

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
    if (!transaction.finished) await transaction.rollback();
    return next(error);
  }
};

/**
 * Submit manual payment details (PayNow / Bank Transfer reference).
 */
const submitPaymentDetails = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  let proofPath;
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { payment_method, transaction_reference, transfer_date, amount } = req.body;

    const payment = await Payment.findOne({
      where: { id, user_id: userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!payment) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Payment record not found or access denied.',
      });
    }

    if (!['PENDING', 'REJECTED'].includes(payment.payment_status)) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: `Cannot submit payment details for payment in status '${payment.payment_status}'.`,
      });
    }

    if (!['BANK_TRANSFER', 'PAYNOW'].includes(payment_method)) { await transaction.rollback(); return res.status(400).json({ success: false, message: 'Choose bank transfer or PayNow QR.' }); }
    if (typeof transaction_reference !== 'string' || !transaction_reference.trim() || transaction_reference.trim().length > 100) { await transaction.rollback(); return res.status(400).json({ success: false, message: 'Enter the bank or PayNow transaction reference.' }); }
    const transferDateValue = String(transfer_date || '');
    const transferDateObject = /^\d{4}-\d{2}-\d{2}$/.test(transferDateValue) ? new Date(`${transferDateValue}T00:00:00Z`) : null;
    if (!transferDateObject || Number.isNaN(transferDateObject.getTime()) || transferDateObject.toISOString().slice(0, 10) !== transferDateValue || transferDateObject > new Date()) { await transaction.rollback(); return res.status(400).json({ success: false, message: 'Enter a valid transfer date that is not in the future.' }); }
    if (Number(amount) !== Number(payment.amount)) { await transaction.rollback(); return res.status(400).json({ success: false, message: 'The amount must match the invoice total exactly.' }); }
    if (!req.paymentProof?.buffer) { await transaction.rollback(); return res.status(400).json({ success: false, message: 'Upload the transfer receipt or payment confirmation.' }); }
    const configured = payment_method === 'BANK_TRANSFER'
      ? Boolean(getBankPaymentDetails().account_name && getBankPaymentDetails().bank_name && getBankPaymentDetails().account_number)
      : Boolean(getPayNowPaymentDetails().uen && getPayNowPaymentDetails().qrPath);
    if (!configured) { await transaction.rollback(); return res.status(503).json({ success: false, message: 'Payment instructions are not configured yet. Please contact WISTA Singapore Finance.' }); }

    const proof = req.paymentProof;
    const storageKey = `${randomUUID()}.${proof.mime === 'application/pdf' ? 'pdf' : proof.mime === 'image/jpeg' ? 'jpg' : 'png'}`;
    if (process.env.NODE_ENV === 'production' && !process.env.PAYMENT_DOCUMENT_STORAGE_PATH) { await transaction.rollback(); return res.status(503).json({ success: false, message: 'Finance storage is not configured. Set PAYMENT_DOCUMENT_STORAGE_PATH to a private persistent directory.' }); }
    await fs.mkdir(PAYMENT_STORAGE_DIR, { recursive: true, mode: 0o700 });
    proofPath = path.join(PAYMENT_STORAGE_DIR, storageKey);
    await fs.writeFile(proofPath, proof.buffer, { flag: 'wx', mode: 0o600 });
    const oldStatus = payment.payment_status;
    payment.payment_method = payment_method;
    payment.transaction_reference = transaction_reference.trim();
    payment.payment_status = 'SUBMITTED';
    await payment.save({ transaction });
    await PaymentSubmission.create({
      payment_id: payment.id, user_id: userId, payment_method,
      transaction_reference: transaction_reference.trim(), amount: payment.amount,
      transfer_date, proof_storage_key: storageKey,
      proof_original_name: proof.originalName.slice(0, 255), proof_mime_type: proof.mime,
      proof_size: proof.buffer.length, status: 'SUBMITTED',
    }, { transaction });
    if (payment.event_registration_id) {
      const eventRegistration = await EventRegistration.findByPk(payment.event_registration_id, { transaction, lock: transaction.LOCK.UPDATE });
      if (eventRegistration) { eventRegistration.payment_status = 'SUBMITTED'; await eventRegistration.save({ transaction }); }
    }

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
    if (transaction && !transaction.finished) await transaction.rollback();
    if (proofPath) await fs.unlink(proofPath).catch(() => {});
    next(error);
  }
};

const getPaymentInstructions = async (req, res) => {
  const bankDetails = getBankPaymentDetails();
  const payNowDetails = getPayNowPaymentDetails();
  const bankConfigured = Boolean(bankDetails.account_name && bankDetails.bank_name && bankDetails.account_number);
  const qrConfigured = Boolean(payNowDetails.uen && payNowDetails.qrPath);
  return res.json({ success: true, data: {
    methods: [
      { method: 'BANK_TRANSFER', available: bankConfigured, ...bankDetails },
      { method: 'PAYNOW', available: qrConfigured, uen: qrConfigured ? payNowDetails.uen : null, qr_url: qrConfigured ? '/api/payments/instructions/paynow-qr' : null },
    ],
  } });
};

const getPayNowQr = async (req, res, next) => {
  try {
    const payNowDetails = getPayNowPaymentDetails();
    if (!payNowDetails.qrPath || !payNowDetails.uen) return res.status(404).json({ success: false, message: 'PayNow QR is not configured.' });
    const filePath = path.resolve(payNowDetails.qrPath);
    const resolvedRoot = path.dirname(filePath);
    const stat = await fs.stat(filePath);
    if (!stat.isFile() || stat.size > 5 * 1024 * 1024) return res.status(404).json({ success: false, message: 'PayNow QR is unavailable.' });
    const ext = path.extname(filePath).toLowerCase();
    const mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : null;
    if (!mime) return res.status(415).json({ success: false, message: 'PayNow QR must be PNG or JPEG.' });
    res.set({ 'Content-Type': mime, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' });
    return res.sendFile(path.basename(filePath), { root: resolvedRoot }, (error) => { if (error && !res.headersSent) next(error); });
  } catch (error) { if (error.code === 'ENOENT') return res.status(404).json({ success: false, message: 'PayNow QR is unavailable.' }); return next(error); }
};

const downloadPaymentProof = async (req, res, next) => {
  try {
    const submission = await PaymentSubmission.findByPk(req.params.submissionId, { include: [{ model: Payment, as: 'payment' }] });
    if (!submission || String(submission.payment_id) !== String(req.params.id)) return res.status(404).json({ success: false, message: 'Payment proof not found.' });
    const filePath = path.join(PAYMENT_STORAGE_DIR, path.basename(submission.proof_storage_key));
    await fs.access(filePath);
    await AuditLog.create({
      user_id: req.user.id, action: 'PAYMENT_PROOF_ACCESS_GRANTED', module: 'PAYMENT',
      entity_type: 'PaymentSubmission', entity_id: String(submission.id),
      new_values: { payment_id: submission.payment_id }, ip_address: req.ip,
      user_agent: String(req.get('user-agent') || '').slice(0, 500),
    });
    res.set({ 'Content-Type': submission.proof_mime_type, 'Content-Disposition': `attachment; filename="${submission.proof_original_name.replace(/["\\\r\n]/g, '_')}"`, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' });
    return res.sendFile(filePath, (error) => { if (error && !res.headersSent) next(error); });
  } catch (error) { if (error.code === 'ENOENT') return res.status(404).json({ success: false, message: 'Payment proof is unavailable.' }); return next(error); }
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
        { model: PaymentSubmission, as: 'submissions', attributes: { exclude: ['proof_storage_key'] } },
        { model: EventRegistration, as: 'eventRegistration', attributes: ['id', 'event_id', 'status', 'payment_status', 'ticket_uid'], include: [{ model: Event, as: 'event', attributes: ['id', 'title', 'starts_at', 'location', 'format', 'status'] }] },
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

    const { status, payment_method, purpose, search } = req.query;
    const where = {};

    if (status) where.payment_status = status;
    if (payment_method) where.payment_method = payment_method;
    if (purpose && ['MEMBERSHIP', 'EVENT'].includes(purpose)) where.purpose = purpose;

    if (search) {
      where[Op.or] = [
        { payment_reference: { [Op.like]: `%${search}%` } },
        { transaction_reference: { [Op.like]: `%${search}%` } },
        { '$invoice.invoice_number$': { [Op.like]: `%${search}%` } },
        { '$invoice.description$': { [Op.like]: `%${search}%` } },
        { '$application.application_number$': { [Op.like]: `%${search}%` } },
        { '$membership.membership_number$': { [Op.like]: `%${search}%` } },
        { '$user.email$': { [Op.like]: `%${search}%` } },
        { '$user.first_name$': { [Op.like]: `%${search}%` } },
        { '$user.last_name$': { [Op.like]: `%${search}%` } },
      ];
    }

    const safePaymentAttributes = [
      'id', 'payment_reference', 'application_id', 'event_registration_id', 'purpose', 'user_id', 'membership_id', 'amount', 'currency',
      'payment_method', 'payment_status', 'transaction_reference', 'paid_at', 'verified_at',
      'failure_reason', 'notes', 'createdAt', 'updatedAt',
    ];
    const invoiceAttributes = [
      'id', 'invoice_number', 'payment_id', 'application_id', 'event_registration_id', 'membership_type', 'description', 'period_start', 'period_end', 'subtotal',
      'discount', 'total', 'currency', 'status', 'issued_at', 'due_at', 'paid_at',
    ];
    const applicationAttributes = ['id', 'application_number', 'membership_type', 'status', 'submitted_at', 'approved_at'];
    const membershipAttributes = ['id', 'membership_number', 'membership_type', 'status', 'start_date', 'end_date'];

    const { count, rows: payments } = await Payment.findAndCountAll({
      attributes: safePaymentAttributes,
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'first_name', 'last_name', 'phone'] },
        { model: User, as: 'verifier', attributes: ['id', 'email', 'first_name', 'last_name'] },
        { model: Invoice, as: 'invoice', attributes: invoiceAttributes },
        { model: MembershipApplication, as: 'application', attributes: applicationAttributes },
        { model: Membership, as: 'membership', attributes: membershipAttributes },
        { model: EventRegistration, as: 'eventRegistration', attributes: ['id', 'event_id'], include: [{ model: Event, as: 'event', attributes: ['id', 'title'] }] },
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
      attributes: [
        'id', 'payment_reference', 'application_id', 'event_registration_id', 'purpose', 'user_id', 'membership_id', 'amount', 'currency',
        'payment_method', 'payment_status', 'transaction_reference', 'paid_at', 'verified_at',
        'failure_reason', 'notes', 'createdAt', 'updatedAt',
      ],
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'first_name', 'last_name', 'phone'] },
        { model: User, as: 'verifier', attributes: ['id', 'email', 'first_name', 'last_name'] },
        { model: Invoice, as: 'invoice', attributes: ['id', 'invoice_number', 'payment_id', 'application_id', 'event_registration_id', 'membership_type', 'description', 'period_start', 'period_end', 'subtotal', 'discount', 'total', 'currency', 'status', 'issued_at', 'due_at', 'paid_at'] },
        { model: MembershipApplication, as: 'application', attributes: ['id', 'application_number', 'membership_type', 'status', 'submitted_at', 'approved_at'] },
        { model: Membership, as: 'membership', attributes: ['id', 'membership_number', 'membership_type', 'status', 'start_date', 'end_date'] },
        { model: PaymentSubmission, as: 'submissions', attributes: { exclude: ['proof_storage_key'] }, include: [{ model: User, as: 'reviewer', attributes: ['id', 'email', 'first_name', 'last_name'] }] },
        { model: EventRegistration, as: 'eventRegistration', include: [{ model: Event, as: 'event', attributes: ['id', 'title', 'starts_at', 'location'] }] },
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

    const payment = await Payment.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!payment) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (String(payment.user_id) === String(req.user.id)) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: 'You cannot verify your own payment.' });
    }

    if (payment.payment_status === 'PAID') {
      await transaction.rollback();
      return res.json({ success: true, message: 'Payment has already been verified.', data: { payment } });
    }
    if (['REFUNDED', 'CANCELLED'].includes(payment.payment_status)) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: `Payment is already in status '${payment.payment_status}'. Cannot verify.`,
      });
    }

    const oldStatus = payment.payment_status;
    const now = new Date();
    const latestSubmission = await PaymentSubmission.findOne({ where: { payment_id: payment.id, status: 'SUBMITTED' }, order: [['created_at', 'DESC']], transaction, lock: transaction.LOCK.UPDATE });
    if (!latestSubmission && payment.payment_method !== 'COMPLIMENTARY') {
      await transaction.rollback();
      return res.status(409).json({ success: false, message: 'A submitted transfer proof is required before Finance can verify this payment.' });
    }

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

    if (latestSubmission) {
      latestSubmission.status = 'VERIFIED'; latestSubmission.reviewed_by = req.user.id; latestSubmission.reviewed_at = now;
      await latestSubmission.save({ transaction });
    }
    let eventRegistration = null;
    if (payment.event_registration_id) {
      eventRegistration = await EventRegistration.findByPk(payment.event_registration_id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!eventRegistration) { await transaction.rollback(); return res.status(409).json({ success: false, message: 'The linked event registration no longer exists.' }); }
      eventRegistration.payment_status = 'PAID';
      eventRegistration.status = 'REGISTERED';
      eventRegistration.ticket_uid = eventRegistration.ticket_uid || randomUUID();
      await eventRegistration.save({ transaction });
    }
    let membership = null;
    if (payment.application_id) {
      membership = await activateMembership({
        applicationId: payment.application_id, adminId: req.user.id, transaction,
        membershipPeriod: invoice?.period_start && invoice?.period_end ? { start_date: invoice.period_start, end_date: invoice.period_end } : null,
      });
      const application = await MembershipApplication.findByPk(payment.application_id, { transaction, lock: transaction.LOCK.UPDATE });
      if (application?.status === 'PAYMENT_PENDING') {
        application.status = 'APPROVED';
        await application.save({ transaction });
        await MembershipStatusHistory.create({ application_id: application.id, old_status: 'PAYMENT_PENDING', new_status: 'APPROVED', changed_by: req.user.id, reason: 'Membership activated after Finance verified payment.' }, { transaction });
      }
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
      message: payment.purpose === 'EVENT' ? 'Event payment verified. Registration is confirmed and the ticket is available.' : 'Payment successfully verified. Membership activation is complete.',
      data: {
        payment,
        invoice,
        membership,
        eventRegistration,
      },
    });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    return next(error);
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

    const payment = await Payment.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
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
    const latestSubmission = await PaymentSubmission.findOne({ where: { payment_id: payment.id, status: 'SUBMITTED' }, order: [['created_at', 'DESC']], transaction, lock: transaction.LOCK.UPDATE });
    if (latestSubmission) { latestSubmission.status = 'REJECTED'; latestSubmission.review_reason = failure_reason.trim(); latestSubmission.reviewed_by = req.user.id; latestSubmission.reviewed_at = new Date(); await latestSubmission.save({ transaction }); }
    if (payment.event_registration_id) {
      const eventRegistration = await EventRegistration.findByPk(payment.event_registration_id, { transaction, lock: transaction.LOCK.UPDATE });
      if (eventRegistration) { eventRegistration.payment_status = 'REJECTED'; await eventRegistration.save({ transaction }); }
    }

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
  getPaymentInstructions,
  getPayNowQr,
  downloadPaymentProof,
};
