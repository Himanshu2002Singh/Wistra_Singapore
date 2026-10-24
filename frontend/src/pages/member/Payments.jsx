import React, { useCallback, useEffect, useMemo, useState } from 'react';
import MemberLayout from '@/components/member/MemberLayout';
import { createPaymentApi, getMyPaymentsApi, submitPaymentDetailsApi, getInvoiceByIdApi, getPaymentInstructionsApi, getPayNowQrApi } from '@/services/paymentService';
import { getMyApplicationsApi } from '@/services/membershipService';
import { Wallet, CheckCircle2, FileText, X, AlertCircle } from 'lucide-react';

const PAYMENT_STATUS_STYLES = {
  PENDING: 'bg-amber-400/15 text-amber-300 border-amber-300/30',
  SUBMITTED: 'bg-[#5ee5e9]/15 text-[#5ee5e9] border-[#5ee5e9]/30',
  UNDER_VERIFICATION: 'bg-violet-400/15 text-violet-300 border-violet-300/30',
  PAID: 'bg-[#59D781]/15 text-[#59D781] border-[#59D781]/30',
  FAILED: 'bg-red-400/15 text-red-300 border-red-300/30',
  REJECTED: 'bg-red-400/15 text-red-300 border-red-300/30',
  REFUNDED: 'bg-slate-400/15 text-slate-300 border-slate-300/30',
  CANCELLED: 'bg-slate-400/15 text-slate-300 border-slate-300/30',
};

const INVOICE_STATUS_STYLES = {
  DRAFT: 'text-slate-300',
  ISSUED: 'text-amber-300',
  PAID: 'text-[#59D781]',
  VOID: 'text-slate-400',
  REFUNDED: 'text-slate-300',
};

const formatDate = (value) => {
  if (!value) return 'Not available';
  const raw = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T12:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return new Intl.DateTimeFormat('en-SG', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};

const formatStatus = (status) => status ? status.replaceAll('_', ' ') : 'Not available';

const formatAmount = (amount, currency) => {
  const value = Number(amount);
  if (!Number.isFinite(value)) return 'Not available';
  return `${currency || 'Currency unavailable'} ${value.toFixed(2)}`;
};

const formatTotalsByCurrency = (rows, predicate) => {
  const totals = rows.reduce((result, row) => {
    if (!predicate(row)) return result;
    const currency = row.currency || 'Currency unavailable';
    result.set(currency, (result.get(currency) || 0) + Number(row.amount || 0));
    return result;
  }, new Map());
  if (!totals.size) return '—';
  return [...totals.entries()].map(([currency, amount]) => `${currency} ${amount.toFixed(2)}`).join(' · ');
};

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingPaymentFor, setCreatingPaymentFor] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(null);
  const [paymentDialogView, setPaymentDialogView] = useState('choices');
  const [txnRefInput, setTxnRefInput] = useState('');
  const [paymentMethodInput, setPaymentMethodInput] = useState('PAYNOW');
  const [transferDateInput, setTransferDateInput] = useState('');
  const [proofFileInput, setProofFileInput] = useState(null);
  const [paymentInstructions, setPaymentInstructions] = useState([]);
  const [payNowQrUrl, setPayNowQrUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await getMyPaymentsApi();
      if (!response?.success || !Array.isArray(response.data)) throw new Error('payments_unavailable');
      setPayments(response.data);
      try {
        const applicationsResponse = await getMyApplicationsApi();
        setApplications(applicationsResponse?.success ? applicationsResponse.data?.applications || [] : []);
      } catch {
        setApplications([]);
      }
    } catch (error) {
      setPayments([]);
      const status = error.response?.status;
      if (status === 404) setLoadError(null);
      else setLoadError(status === 401 ? 'unauthenticated' : status === 403 ? 'forbidden' : 'server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);
  useEffect(() => () => { if (payNowQrUrl) URL.revokeObjectURL(payNowQrUrl); }, [payNowQrUrl]);

  const invoices = useMemo(() => {
    const seen = new Set();
    return payments.map((payment) => payment.invoice).filter((invoice) => {
      if (!invoice || seen.has(String(invoice.id))) return false;
      seen.add(String(invoice.id));
      return true;
    });
  }, [payments]);

  const totalPaid = useMemo(
    () => formatTotalsByCurrency(payments, (payment) => payment.payment_status === 'PAID'),
    [payments]
  );
  const outstanding = useMemo(
    () => formatTotalsByCurrency(payments, (payment) => ['PENDING', 'SUBMITTED', 'UNDER_VERIFICATION'].includes(payment.payment_status)),
    [payments]
  );
  const selectedPaymentInstruction = paymentInstructions.find((item) => item.method === paymentMethodInput);

  const openInvoice = async (invoiceId) => {
    setSelectedInvoice(null);
    setInvoiceError('');
    setInvoiceLoading(true);
    try {
      const response = await getInvoiceByIdApi(invoiceId);
      if (!response?.success || !response.data) throw new Error('invoice_unavailable');
      setSelectedInvoice(response.data);
    } catch (error) {
      const status = error.response?.status;
      setInvoiceError(status === 401
        ? 'Your session expired. Please sign in again.'
        : status === 403
          ? 'You do not have access to this invoice.'
          : status === 404
            ? 'This invoice could not be found.'
            : 'We could not load this invoice. Please try again.');
    } finally {
      setInvoiceLoading(false);
    }
  };

  const closeInvoice = () => {
    setSelectedInvoice(null);
    setInvoiceError('');
    setInvoiceLoading(false);
  };

  const applicationsAwaitingInvoice = useMemo(() => applications.filter((application) => (
    ['PAYMENT_PENDING', 'APPROVED'].includes(application.status)
    && !payments.some((payment) => String(payment.application_id) === String(application.id))
  )), [applications, payments]);

  const createMissingPayment = async (application) => {
    setCreatingPaymentFor(application.id);
    setActionMessage(null);
    try {
      const response = await createPaymentApi({ application_id: application.id });
      if (!response?.success) throw new Error('payment_request_failed');
      setActionMessage({ type: 'success', text: 'Your invoice is ready. Use Pay Now / Submit in Payment History to continue.' });
      await fetchPayments();
    } catch (error) {
      const message = error.response?.data?.message;
      setActionMessage({
        type: 'error',
        text: message || 'We could not prepare your invoice. Please contact Finance or try again later.',
      });
    } finally {
      setCreatingPaymentFor(null);
    }
  };

  const openPaymentDialog = async (payment) => {
    setShowSubmitModal(payment);
    setPaymentDialogView('choices');
    setActionMessage(null);
    setTxnRefInput('');
    setTransferDateInput('');
    setProofFileInput(null);
    setPaymentMethodInput('PAYNOW');
    if (payNowQrUrl) URL.revokeObjectURL(payNowQrUrl);
    setPayNowQrUrl('');
    try {
      const result = await getPaymentInstructionsApi();
      const methods = result?.data?.methods || [];
      setPaymentInstructions(methods);
      if (methods.find((item) => item.method === 'PAYNOW')?.available) {
        try {
          const image = await getPayNowQrApi();
          setPayNowQrUrl(URL.createObjectURL(image));
        } catch {
          setPaymentInstructions((current) => current.map((item) => item.method === 'PAYNOW' ? { ...item, available: false } : item));
        }
      }
    } catch {
      setPaymentInstructions([]);
    }
  };

  const handleSubmitProof = async (event) => {
    event.preventDefault();
    if (!showSubmitModal || !txnRefInput.trim() || !transferDateInput || !proofFileInput) return;
    setSubmitting(true);
    setActionMessage(null);
    try {
      const payload = new FormData();
      payload.append('payment_method', paymentMethodInput);
      payload.append('transaction_reference', txnRefInput.trim());
      payload.append('transfer_date', transferDateInput);
      payload.append('amount', String(showSubmitModal.amount));
      payload.append('proof', proofFileInput);
      const response = await submitPaymentDetailsApi(showSubmitModal.id, payload);
      if (!response?.success) throw new Error('submit_failed');
      setActionMessage({ type: 'success', text: response.message || 'Payment reference submitted for review.' });
      setShowSubmitModal(null);
      setTxnRefInput('');
      setProofFileInput(null);
      setTransferDateInput('');
      await fetchPayments();
    } catch (error) {
      const status = error.response?.status;
      const text = status === 401
        ? 'Your session expired. Please sign in again.'
        : status === 403
          ? 'You do not have access to submit details for this payment.'
          : error.response?.data?.message || 'We could not submit the payment reference. Please try again.';
      setActionMessage({ type: 'error', text });
    } finally {
      setSubmitting(false);
    }
  };

  const loadErrorText = loadError === 'unauthenticated'
    ? 'Your session expired or you are signed out. Please sign in again.'
    : loadError === 'forbidden'
      ? 'You do not have access to these payment records.'
      : 'We could not load payment history. Please check your connection and try again.';

  return (
    <MemberLayout>
      <div className="space-y-8 pb-16">
        {/* Header */}
        <div className="border-b border-white/10 pb-5">
          <div className="flex items-center gap-2 text-[#5ee5e9] text-xs font-bold tracking-[0.2em] uppercase mb-1">
            <Wallet size={14} />
            <span>FINANCIAL RECORD</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-[var(--serif)] font-normal text-white">My Payments</h1>
          <p className="text-sm text-slate-300">View your payment history and invoices, or submit a payment reference for an existing payment.</p>
        </div>

        {actionMessage && (
          <div role={actionMessage.type === 'error' ? 'alert' : 'status'} className={`p-4 rounded-lg text-xs font-semibold flex justify-between items-center ${actionMessage.type === 'error' ? 'bg-red-400/10 border border-red-300/30 text-red-200' : 'bg-[#59D781]/15 border border-[#59D781]/40 text-[#59D781]'}`}>
            <span className="flex items-center gap-2">{actionMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />} {actionMessage.text}</span>
            <button type="button" onClick={() => setActionMessage(null)} aria-label="Dismiss message" className="font-bold ml-4 text-white hover:text-[#59D781]">✕</button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0c243b] p-6 rounded-2xl border border-white/10 shadow-2xl space-y-1">
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Total Paid</p>
            <p className="text-2xl font-[var(--serif)] font-normal text-white">{loading ? 'Loading…' : loadError ? 'Not available' : totalPaid}</p>
          </div>
          <div className="bg-[#0c243b] p-6 rounded-2xl border border-white/10 shadow-2xl space-y-1">
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Outstanding Payments</p>
            <p className="text-2xl font-[var(--serif)] font-normal text-white">{loading ? 'Loading…' : loadError ? 'Not available' : outstanding}</p>
          </div>
          <div className="bg-[#0c243b] p-6 rounded-2xl border border-white/10 shadow-2xl space-y-1 flex flex-col justify-center">
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Invoices on Record</p>
            <p className="text-2xl font-[var(--serif)] font-normal text-white">{loading ? 'Loading…' : loadError ? 'Not available' : invoices.length}</p>
          </div>
        </div>

        {loadError && (
          <div role="alert" className="p-4 bg-red-400/10 border border-red-300/30 text-red-200 rounded-lg text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span>{loadErrorText}</span>
            {loadError !== 'unauthenticated' && <button type="button" onClick={fetchPayments} className="font-semibold underline self-start">Try again</button>}
          </div>
        )}

        {applicationsAwaitingInvoice.length > 0 && (
          <section className="bg-[#0c243b] rounded-2xl border border-amber-300/30 p-5 space-y-4" aria-labelledby="invoice-setup-title">
            <div>
              <h2 id="invoice-setup-title" className="text-lg font-[var(--serif)] text-white">Payment setup</h2>
              <p className="mt-1 text-sm text-slate-300">Your application is approved, but no invoice has been issued yet.</p>
            </div>
            {applicationsAwaitingInvoice.map((application) => (
              <div key={application.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/10 pt-4">
                <div>
                  <p className="text-sm font-semibold text-white">{application.membership_type} membership</p>
                  <p className="text-xs text-slate-400">Application {application.application_number || application.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => createMissingPayment(application)}
                  disabled={creatingPaymentFor !== null}
                  className="px-4 py-2 bg-[#e85d4a] text-white text-xs font-bold tracking-widest uppercase rounded hover:bg-[#f27663] disabled:opacity-60 disabled:cursor-wait"
                >
                  {creatingPaymentFor === application.id ? 'Preparing invoice…' : 'Prepare invoice'}
                </button>
              </div>
            ))}
          </section>
        )}

        {/* Payment History Table */}
        <div className="bg-[#0c243b] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-xl font-[var(--serif)] font-normal text-white">Payment History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[#071626] border-b border-white/10 text-slate-400 uppercase tracking-wider">
                  <th className="p-4 font-bold">Recorded</th>
                  <th className="p-4 font-bold">Payment & Reference</th>
                  <th className="p-4 font-bold">Amount</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-200">
                {loading ? (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-400">Loading payment history…</td></tr>
                ) : loadError ? (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-400">Payment records are unavailable.</td></tr>
                ) : payments.length > 0 ? payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-white/5 transition">
                    <td className="p-4">{formatDate(payment.created_at)}</td>
                    <td className="p-4">
                      <p className="font-semibold text-white">{payment.purpose === 'EVENT' ? payment.eventRegistration?.event?.title || payment.invoice?.description || 'Event registration payment' : payment.application?.membership_type ? `${payment.application.membership_type} membership payment` : 'Membership payment'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Payment: {payment.payment_reference || 'Not available'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Transaction: {payment.transaction_reference || 'Not submitted'}</p>
                      <p className="text-[10px] text-slate-400">{payment.application?.application_number ? `Application ${payment.application.application_number}` : payment.application_id ? `Application ${payment.application_id}` : 'Application not available'}{payment.membership_id ? ` · Membership ${payment.membership_id}` : ''}</p>
                      <p className="text-[10px] text-slate-400">{payment.purpose === 'EVENT' ? `Event registration${payment.eventRegistration?.event?.starts_at ? ` · ${formatDate(payment.eventRegistration.event.starts_at)}` : ''}${payment.eventRegistration?.event?.location ? ` · ${payment.eventRegistration.event.location}` : ''}` : `Purpose: ${payment.application?.membership_type || payment.invoice?.membership_type || 'Membership'} membership`}</p>
                      {(payment.submissions || []).map((submission) => <p key={submission.id} className="mt-1 text-[10px] text-slate-400">Submission {formatDate(submission.created_at)} · {formatStatus(submission.status)}{submission.review_reason ? ` · Finance: ${submission.review_reason}` : ''}</p>)}
                    </td>
                    <td className="p-4 font-mono font-bold text-[#5ee5e9]">{formatAmount(payment.amount, payment.currency)}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${PAYMENT_STATUS_STYLES[payment.payment_status] || 'bg-white/10 text-slate-200 border-white/20'}`}>
                        {formatStatus(payment.payment_status)}
                      </span>
                      {payment.paid_at && <p className="mt-1 text-[10px] text-slate-400">Paid {formatDate(payment.paid_at)}</p>}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      {['PENDING', 'REJECTED'].includes(payment.payment_status) ? (
                        <button type="button" onClick={() => openPaymentDialog(payment)} className="member-payment-action">
                          Pay Now / Submit
                        </button>
                      ) : payment.invoice?.id ? (
                        <button type="button" onClick={() => openInvoice(payment.invoice.id)} className="text-[#5ee5e9] hover:underline text-xs font-semibold">View Invoice</button>
                      ) : <span className="text-slate-500 text-xs">No action available</span>}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-400">No payment history was found for your account.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice History */}
        <div className="bg-[#0c243b] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center gap-2">
            <FileText size={17} className="text-[#5ee5e9]" />
            <h2 className="text-xl font-[var(--serif)] font-normal text-white">Invoice History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[#071626] border-b border-white/10 text-slate-400 uppercase tracking-wider">
                  <th className="p-4 font-bold">Invoice</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Amount</th>
                  <th className="p-4 font-bold">Issued</th>
                  <th className="p-4 font-bold">Due</th>
                  <th className="p-4 font-bold">Paid</th>
                  <th className="p-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-200">
                {loading ? (
                  <tr><td colSpan="7" className="p-8 text-center text-slate-400">Loading invoices…</td></tr>
                ) : loadError ? (
                  <tr><td colSpan="7" className="p-8 text-center text-slate-400">Invoice records are unavailable.</td></tr>
                ) : invoices.length > 0 ? invoices.map((invoice) => {
                  const relatedPayment = payments.find((payment) => String(payment.id) === String(invoice.payment_id));
                  return (
                    <tr key={invoice.id} className="hover:bg-white/5 transition">
                      <td className="p-4 font-mono font-semibold text-white">{invoice.invoice_number || 'Not available'}<p className="mt-1 font-sans text-[10px] text-slate-400">{invoice.description || invoice.membership_type || relatedPayment?.application?.membership_type || 'Membership'}</p>{invoice.period_start && invoice.period_end && <p className="mt-1 font-sans text-[10px] text-slate-500">{formatDate(invoice.period_start)} – {formatDate(invoice.period_end)}</p>}</td>
                      <td className="p-4"><span className={`font-bold ${INVOICE_STATUS_STYLES[invoice.status] || 'text-slate-200'}`}>{formatStatus(invoice.status)}</span></td>
                      <td className="p-4 font-mono">{formatAmount(invoice.total, invoice.currency)}</td>
                      <td className="p-4">{formatDate(invoice.issued_at)}</td>
                      <td className="p-4">{formatDate(invoice.due_at)}</td>
                      <td className="p-4">{formatDate(invoice.paid_at)}</td>
                      <td className="p-4 text-right"><button type="button" onClick={() => openInvoice(invoice.id)} className="text-[#5ee5e9] hover:underline font-semibold">View</button></td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan="7" className="p-8 text-center text-slate-400">No invoices were found for your account.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit payment reference modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="payment-dialog-panel rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
              <div className="flex justify-between items-start border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  {paymentDialogView !== 'choices' && <button type="button" onClick={() => setPaymentDialogView('choices')} className="payment-dialog-back">Back</button>}
                  <h3 className="text-2xl font-[var(--serif)] text-white">{paymentDialogView === 'choices' ? 'Complete Your Payment' : paymentDialogView === 'make_payment' ? 'Make a Payment' : 'Submit Receipt'}</h3>
                </div>
                <button type="button" onClick={() => setShowSubmitModal(null)} disabled={submitting} aria-label="Close" className="text-slate-400 hover:text-white disabled:opacity-50"><X size={20} /></button>
              </div>

              <p className="text-xs text-slate-300">Invoice amount: <strong className="text-white font-mono">{formatAmount(showSubmitModal.amount, showSubmitModal.currency)}</strong>{showSubmitModal.payment_reference && <> · Reference: <strong className="text-white font-mono">{showSubmitModal.payment_reference}</strong></>}</p>

              {paymentDialogView === 'choices' && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-300">Choose whether you want to pay now or record a payment you have already made.</p>
                  <button type="button" className="payment-flow-choice" onClick={() => { setPaymentDialogView('make_payment'); setPaymentMethodInput('PAYNOW'); }}>
                    <span className="payment-flow-choice-title">Make a Payment</span>
                    <span className="payment-flow-choice-copy">View the WISTA PayNow QR or bank transfer details.</span>
                  </button>
                  <button type="button" className="payment-flow-choice" onClick={() => setPaymentDialogView('submit_receipt')}>
                    <span className="payment-flow-choice-title">Submit Receipt</span>
                    <span className="payment-flow-choice-copy">Enter your transfer reference and upload proof for Finance to verify.</span>
                  </button>
                </div>
              )}

              {paymentDialogView === 'make_payment' && (
                <div className="space-y-4">
                  <div className="payment-method-choices" role="group" aria-label="Choose payment method">
                    <button type="button" aria-pressed={paymentMethodInput === 'PAYNOW'} className="payment-method-choice" onClick={() => setPaymentMethodInput('PAYNOW')}>QR / PayNow</button>
                    <button type="button" aria-pressed={paymentMethodInput === 'BANK_TRANSFER'} className="payment-method-choice" onClick={() => setPaymentMethodInput('BANK_TRANSFER')}>Bank Transfer</button>
                  </div>
                  {!selectedPaymentInstruction?.available ? (
                    <p role="alert" className="payment-instructions-alert">Payment details are temporarily unavailable. Please contact WISTA Singapore Finance.</p>
                  ) : paymentMethodInput === 'BANK_TRANSFER' ? (
                    <div className="payment-details-panel space-y-2">
                      <p>Account name <strong>{selectedPaymentInstruction.account_name}</strong></p>
                      <p>Bank <strong>{selectedPaymentInstruction.bank_name}</strong></p>
                      <p>Bank code <strong>{selectedPaymentInstruction.bank_code || 'Not provided'}</strong> · Branch code <strong>{selectedPaymentInstruction.branch_code || 'Not provided'}</strong></p>
                      <p>Account number <strong>{selectedPaymentInstruction.account_number}</strong></p>
                      <p>SWIFT code <strong>{selectedPaymentInstruction.swift_bic || 'Not provided'}</strong></p>
                      {selectedPaymentInstruction.address && <p>Bank address <strong>{selectedPaymentInstruction.address}</strong></p>}
                      <p className="payment-reference-note">Include invoice reference <strong>{showSubmitModal.payment_reference || showSubmitModal.invoice?.invoice_number || 'shown on your invoice'}</strong> with your transfer.</p>
                    </div>
                  ) : (
                    <div className="payment-details-panel flex flex-col items-center gap-3 text-center">
                      <p>Scan this WISTA Singapore PayNow QR to pay <strong>{formatAmount(showSubmitModal.amount, showSubmitModal.currency)}</strong>.</p>
                      <p>UEN <strong className="font-mono">{selectedPaymentInstruction.uen}</strong></p>
                      {payNowQrUrl ? <img src={payNowQrUrl} alt="WISTA Singapore official PayNow QR code" className="payment-paynow-qr" /> : <p role="status">Loading official PayNow QR…</p>}
                      <p className="payment-reference-note">Use invoice reference <strong>{showSubmitModal.payment_reference || showSubmitModal.invoice?.invoice_number || 'shown on your invoice'}</strong> as the payment description.</p>
                    </div>
                  )}
                  <button type="button" className="payment-secondary-action w-full" onClick={() => setPaymentDialogView('submit_receipt')}>I have paid — Submit Receipt</button>
                </div>
              )}

              {paymentDialogView === 'submit_receipt' && (
                <form onSubmit={handleSubmitProof} className="space-y-4">
                  <p className="text-xs text-slate-300">Enter the transaction details and upload your receipt so Finance can verify the payment.</p>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-1">Payment Method</label>
                    <select value={paymentMethodInput} onChange={(event) => setPaymentMethodInput(event.target.value)} className="w-full p-3 bg-[#071626] border border-white/20 rounded text-xs text-white">
                      <option value="PAYNOW">QR Transfer (PayNow)</option>
                      <option value="BANK_TRANSFER">Account Transfer</option>
                    </select>
                  </div>
                  {!selectedPaymentInstruction?.available ? <p role="alert" className="payment-instructions-alert">Payment details are temporarily unavailable. Please contact WISTA Singapore Finance.</p> : paymentMethodInput === 'BANK_TRANSFER' ? (
                    <div className="payment-details-panel space-y-2">
                      <p>Account name <strong>{selectedPaymentInstruction.account_name}</strong></p>
                      <p>Bank <strong>{selectedPaymentInstruction.bank_name}</strong></p>
                      <p>Bank code <strong>{selectedPaymentInstruction.bank_code || 'Not provided'}</strong> · Branch code <strong>{selectedPaymentInstruction.branch_code || 'Not provided'}</strong></p>
                      <p>Account number <strong>{selectedPaymentInstruction.account_number}</strong></p>
                      <p>SWIFT code <strong>{selectedPaymentInstruction.swift_bic || 'Not provided'}</strong></p>
                      <p className="payment-reference-note">Include invoice reference <strong>{showSubmitModal.payment_reference || showSubmitModal.invoice?.invoice_number || 'shown on your invoice'}</strong> with your transfer.</p>
                    </div>
                  ) : (
                    <div className="payment-details-panel flex flex-col items-center gap-3 text-center">
                      <p>Pay <strong>{formatAmount(showSubmitModal.amount, showSubmitModal.currency)}</strong> using WISTA Singapore PayNow.</p>
                      <p>UEN <strong className="font-mono">{selectedPaymentInstruction.uen}</strong></p>
                      {payNowQrUrl ? <img src={payNowQrUrl} alt="WISTA Singapore official PayNow QR code" className="payment-paynow-qr" /> : <p role="status">Loading official PayNow QR…</p>}
                      <p className="payment-reference-note">Use invoice reference <strong>{showSubmitModal.payment_reference || showSubmitModal.invoice?.invoice_number || 'shown on your invoice'}</strong> as the payment description.</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-1">Transaction / Reference No.</label>
                    <input type="text" value={txnRefInput} onChange={(event) => setTxnRefInput(event.target.value)} maxLength={100} className="w-full p-3 bg-[#071626] border border-white/20 rounded text-xs text-white focus:border-[#5ee5e9] focus:outline-none" required />
                  </div>
                  <div><label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-1">Amount transferred (SGD)</label><input type="number" value={showSubmitModal.amount} readOnly className="w-full p-3 bg-[#071626] border border-white/20 rounded text-xs text-white" /></div>
                  <div><label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-1">Transfer date</label><input type="date" max={new Date().toISOString().slice(0, 10)} value={transferDateInput} onChange={(event) => setTransferDateInput(event.target.value)} className="w-full p-3 bg-[#071626] border border-white/20 rounded text-xs text-white" required /></div>
                  <div><label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-1">Receipt or screenshot (PDF, JPEG, PNG; max 5 MB)</label><input type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => setProofFileInput(event.target.files?.[0] || null)} className="w-full text-xs text-slate-300" required /></div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button type="button" onClick={() => setShowSubmitModal(null)} disabled={submitting} className="px-4 py-2 border border-white/20 text-slate-300 text-xs font-bold uppercase rounded hover:bg-white/10 disabled:opacity-50">Cancel</button>
                    <button type="submit" disabled={submitting || !proofFileInput || !transferDateInput || !selectedPaymentInstruction?.available} className="payment-submit-button">{submitting ? 'Submitting…' : 'Submit for Verification'}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Invoice detail modal; the API returns invoice data, not a PDF. */}
        {(invoiceLoading || invoiceError || selectedInvoice) && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-[#0c243b] border border-white/20 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
              <div className="flex justify-between items-start border-b border-white/10 pb-4">
                <h3 className="text-2xl font-[var(--serif)] text-white">Invoice Details</h3>
                <button type="button" onClick={closeInvoice} disabled={invoiceLoading} aria-label="Close invoice details" className="text-slate-400 hover:text-white disabled:opacity-50"><X size={20} /></button>
              </div>
              {invoiceLoading ? <p role="status" className="text-sm text-slate-300">Loading invoice…</p> : invoiceError ? <p role="alert" className="text-sm text-red-200">{invoiceError}</p> : selectedInvoice && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <p className="text-slate-400">Invoice number<span className="block mt-1 text-white font-mono">{selectedInvoice.invoice_number || 'Not available'}</span></p>
                  <p className="text-slate-400">Status<span className="block mt-1 text-white">{formatStatus(selectedInvoice.status)}</span></p>
                  <p className="text-slate-400">Purpose / details<span className="block mt-1 text-white">{selectedInvoice.description || selectedInvoice.membership_type || 'Not available'}</span></p>
                  {selectedInvoice.period_start && <p className="text-slate-400">Membership period<span className="block mt-1 text-white">{formatDate(selectedInvoice.period_start)} – {formatDate(selectedInvoice.period_end)}</span></p>}
                  <p className="text-slate-400">Total<span className="block mt-1 text-white font-mono">{formatAmount(selectedInvoice.total, selectedInvoice.currency)}</span></p>
                  <p className="text-slate-400">Issued<span className="block mt-1 text-white">{formatDate(selectedInvoice.issued_at)}</span></p>
                  <p className="text-slate-400">Due<span className="block mt-1 text-white">{formatDate(selectedInvoice.due_at)}</span></p>
                  <p className="text-slate-400">Paid<span className="block mt-1 text-white">{formatDate(selectedInvoice.paid_at)}</span></p>
                  <p className="text-slate-400">Application ID<span className="block mt-1 text-white">{selectedInvoice.application_id || 'Not available'}</span></p>
                  <p className="text-slate-400">Payment reference<span className="block mt-1 text-white font-mono">{selectedInvoice.payment?.payment_reference || 'Not available'}</span></p>
                  <p className="text-slate-400">Payment status<span className="block mt-1 text-white">{formatStatus(selectedInvoice.payment?.payment_status)}</span></p>
                  <p className="sm:col-span-2 text-slate-400">Invoice subtotal<span className="block mt-1 text-white font-mono">{formatAmount(selectedInvoice.subtotal, selectedInvoice.currency)}</span></p>
                </div>
              )}
              <div className="border-t border-white/10 pt-4 text-[11px] text-slate-400">Invoice details are shown from the backend record. PDF download is not available.</div>
            </div>
          </div>
        )}
      </div>
    </MemberLayout>
  );
};

export default Payments;
