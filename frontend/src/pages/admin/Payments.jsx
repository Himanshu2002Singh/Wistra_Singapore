import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, Search, X } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/context/AuthContext'
import {
  getAdminPaymentByIdApi,
  getAdminPaymentsApi,
  getInvoiceByIdApi,
  refundPaymentApi,
  rejectPaymentApi,
  verifyPaymentApi,
} from '@/services/paymentService'

const PAGE_SIZE = 10
const PAYMENT_STATUSES = ['PENDING', 'SUBMITTED', 'UNDER_VERIFICATION', 'PAID', 'FAILED', 'REJECTED', 'REFUNDED', 'CANCELLED']
const PAYMENT_METHODS = ['BANK_TRANSFER', 'PAYNOW', 'CARD', 'COMPLIMENTARY', 'OTHER']
const humanize = (value) => String(value ?? '').replaceAll('_', ' ')
const memberName = (user) => [user?.first_name, user?.last_name].filter(Boolean).join(' ') || '—'
const dateValue = (value, includeTime = false) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-SG', includeTime ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: 'short', year: 'numeric' })
}
const moneyValue = (currency, amount) => {
  if (amount === null || amount === undefined) return '—'
  const numericAmount = Number(amount)
  return `${currency || ''} ${Number.isNaN(numericAmount) ? amount : numericAmount.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim()
}
const errorMessage = (error, subject) => {
  const status = error.response?.status
  if (status === 401) return 'Your session has expired. Sign in again to continue.'
  if (status === 403) return 'You do not have permission to access this payment or invoice.'
  if (status === 404) return `${subject} was not found.`
  if (status === 409 || status === 400) return error.response?.data?.message || 'The request could not be completed.'
  if (!error.response) return 'The API could not be reached. Check the connection and try again.'
  return error.response?.data?.message || 'The request failed. Try again.'
}
const hasAnyPermission = (user, ...permissions) => {
  const roleName = user?.role?.name || user?.role
  return roleName === 'SUPER_ADMIN' || permissions.some((permission) => user?.permissions?.includes(permission))
}

function DetailRows({ title, values }) {
  const entries = Object.entries(values || {}).filter(([, value]) => value !== null && value !== undefined && value !== '')
  if (!entries.length) return null
  return <section className="admin-payment-detail-section"><h3>{title}</h3><dl>{entries.map(([key, value]) => <React.Fragment key={key}><dt>{humanize(key)}</dt><dd>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd></React.Fragment>)}</dl></section>
}

export default function Payments() {
  const { user } = useAuth()
  const [payments, setPayments] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [invoiceDetail, setInvoiceDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [invoiceError, setInvoiceError] = useState('')
  const [notice, setNotice] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [failureReason, setFailureReason] = useState('')
  const [actionNotes, setActionNotes] = useState('')
  const [refundConfirm, setRefundConfirm] = useState(false)
  const requestSequence = useRef(0)
  const detailSequence = useRef(0)
  const actionLock = useRef(false)

  const loadPayments = useCallback(async () => {
    const sequence = ++requestSequence.current
    setLoading(true)
    setListError('')
    try {
      const response = await getAdminPaymentsApi({
        page,
        limit: PAGE_SIZE,
        ...(status ? { status } : {}),
        ...(paymentMethod ? { payment_method: paymentMethod } : {}),
        ...(query.trim() ? { search: query.trim() } : {}),
      })
      if (sequence !== requestSequence.current) return
      const data = response?.data || {}
      setPayments(Array.isArray(data.payments) ? data.payments : [])
      setTotal(Number(data.total) || 0)
      setTotalPages(Math.max(Number(data.totalPages) || 1, 1))
    } catch (error) {
      if (sequence === requestSequence.current) {
        setPayments([])
        setTotal(0)
        setTotalPages(1)
        setListError(errorMessage(error, 'Payments'))
      }
    } finally {
      if (sequence === requestSequence.current) setLoading(false)
    }
  }, [page, status, paymentMethod, query])

  useEffect(() => {
    const timer = window.setTimeout(loadPayments, query ? 300 : 0)
    return () => window.clearTimeout(timer)
  }, [loadPayments, query])

  const loadDetail = useCallback(async (id) => {
    const sequence = ++detailSequence.current
    setSelectedId(id)
    setDetail(null)
    setInvoiceDetail(null)
    setDetailError('')
    setInvoiceError('')
    setActionError('')
    setFailureReason('')
    setActionNotes('')
    setRefundConfirm(false)
    setDetailLoading(true)
    try {
      const response = await getAdminPaymentByIdApi(id)
      const payment = response?.data || null
      if (sequence !== detailSequence.current) return
      setDetail(payment)
      if (payment?.invoice?.id) {
        try {
          const invoiceResponse = await getInvoiceByIdApi(payment.invoice.id)
          if (sequence === detailSequence.current) setInvoiceDetail(invoiceResponse?.data || null)
        } catch (error) {
          if (sequence === detailSequence.current) setInvoiceError(errorMessage(error, 'Invoice'))
        }
      }
    } catch (error) {
      if (sequence === detailSequence.current) setDetailError(errorMessage(error, 'Payment'))
    } finally {
      if (sequence === detailSequence.current) setDetailLoading(false)
    }
  }, [])

  const closeDetail = () => {
    detailSequence.current += 1
    setSelectedId(null)
    setDetail(null)
    setInvoiceDetail(null)
    setActionError('')
    setRefundConfirm(false)
  }

  const runPaymentAction = async (action) => {
    if (!detail || actionLock.current) return
    if (action === 'reject' && !failureReason.trim()) {
      setActionError('Enter a reason before rejecting this payment.')
      return
    }
    actionLock.current = true
    setActionLoading(true)
    setActionError('')
    setNotice('')
    try {
      const data = action === 'verify'
        ? { ...(actionNotes.trim() ? { notes: actionNotes.trim() } : {}) }
        : action === 'reject'
          ? { failure_reason: failureReason.trim(), ...(actionNotes.trim() ? { notes: actionNotes.trim() } : {}) }
          : { ...(actionNotes.trim() ? { notes: actionNotes.trim() } : {}) }
      const response = action === 'verify'
        ? await verifyPaymentApi(detail.id, data)
        : action === 'reject'
          ? await rejectPaymentApi(detail.id, data)
          : await refundPaymentApi(detail.id, data)
      setNotice(response?.message || (action === 'verify' ? 'Payment verified by the backend.' : action === 'reject' ? 'Payment rejected.' : 'Payment refunded.'))
      setFailureReason('')
      setActionNotes('')
      setRefundConfirm(false)
      await Promise.all([loadPayments(), loadDetail(detail.id)])
    } catch (error) {
      setActionError(errorMessage(error, 'Payment verification'))
    } finally {
      actionLock.current = false
      setActionLoading(false)
    }
  }

  const canVerify = hasAnyPermission(user, 'payments.manage', 'payments.verify')
  const canReject = hasAnyPermission(user, 'payments.manage', 'payments.reject')
  const canRefund = hasAnyPermission(user, 'payments.manage', 'payments.refund')
  const payment = detail
  const invoice = invoiceDetail || payment?.invoice
  const verificationAvailable = payment && !['PAID', 'REFUNDED', 'CANCELLED'].includes(payment.payment_status)
  const rejectionAvailable = payment && !['PAID', 'REFUNDED'].includes(payment.payment_status)
  const refundAvailable = payment?.payment_status === 'PAID'
  const paymentDate = (item) => item.paid_at || item.createdAt || item.created_at

  return <AdminLayout><div className="admin-sample-module admin-payments-module">
    <div className="admin-sample-title"><div><p className="admin-kicker"><span /> Admin workspace</p><h1>Payments</h1><p>Review payment records and their related invoices.</p></div></div>
    {notice && <div className="admin-sample-notice" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss message"><X size={16} /></button></div>}
    {actionError && selectedId === null && <div className="admin-payment-error" role="alert">{actionError}</div>}
    <div className="admin-sample-controls">
      <label><Search size={16} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search payments..." aria-label="Search payments" /></label>
      <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} aria-label="Filter by payment status"><option value="">All payment statuses</option>{PAYMENT_STATUSES.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}</select>
      <select value={paymentMethod} onChange={(event) => { setPaymentMethod(event.target.value); setPage(1) }} aria-label="Filter by payment method"><option value="">All payment methods</option>{PAYMENT_METHODS.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}</select>
    </div>
    {listError && <div className="admin-payment-error" role="alert">{listError}<button type="button" onClick={loadPayments}>Try again</button></div>}
    <div className="admin-sample-table-wrap"><table className="admin-sample-table"><thead><tr><th>Payment reference</th><th>Member</th><th>Membership type</th><th>Amount</th><th>Method</th><th>Payment status</th><th>Paid / created</th><th>Invoice</th><th>Invoice status</th><th aria-label="Actions">Actions</th></tr></thead><tbody>
      {loading ? <tr><td colSpan="10" className="admin-sample-empty" role="status">Loading payments…</td></tr> : payments.length ? payments.map((item) => <tr key={item.id}>
        <td data-label="Payment reference">{item.payment_reference || item.id}</td><td data-label="Member">{memberName(item.user)}</td>
        <td data-label="Membership type">{humanize(item.application?.membership_type || item.invoice?.membership_type || item.membership?.membership_type)}</td>
        <td data-label="Amount">{moneyValue(item.currency, item.amount)}</td><td data-label="Method">{humanize(item.payment_method)}</td>
        <td data-label="Payment status"><span className={`admin-sample-status status-${String(item.payment_status || '').toLowerCase().replaceAll('_', '-')}`}>{humanize(item.payment_status)}</span></td>
        <td data-label="Paid / created">{dateValue(paymentDate(item))}</td><td data-label="Invoice">{item.invoice?.invoice_number || '—'}</td>
        <td data-label="Invoice status">{item.invoice?.status ? <span className={`admin-sample-status status-${String(item.invoice.status).toLowerCase()}`}>{humanize(item.invoice.status)}</span> : '—'}</td>
        <td data-label="Actions"><div className="admin-sample-actions"><button onClick={() => loadDetail(item.id)} className="admin-sample-view"><Eye size={14} /> View</button></div></td>
      </tr>) : <tr><td colSpan="10" className="admin-sample-empty">{total === 0 && !query && !status && !paymentMethod ? 'No payments found.' : 'No payments match these filters.'}</td></tr>}
    </tbody></table></div>
    <div className="admin-sample-pagination"><span>{loading ? 'Loading records' : `${total} payment${total === 1 ? '' : 's'}${totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ''}`}</span><div><button disabled={loading || page <= 1} onClick={() => setPage((current) => Math.max(current - 1, 1))}>Previous</button><button disabled={loading || page >= totalPages} onClick={() => setPage((current) => Math.min(current + 1, totalPages))}>Next</button></div></div>

    {selectedId !== null && <div className="admin-sample-modal" role="dialog" aria-modal="true" aria-label="Payment detail"><div>
      <button className="admin-sample-modal-close" onClick={closeDetail} aria-label="Close payment details"><X size={18} /></button>
      <p className="admin-kicker"><span /> Finance detail</p>
      {detailLoading ? <p className="admin-payment-state" role="status">Loading payment details…</p> : detailError ? <div className="admin-payment-error" role="alert">{detailError}<button type="button" onClick={() => loadDetail(selectedId)}>Try again</button></div> : payment && <>
        <h2>{payment.payment_reference || `Payment ${payment.id}`}</h2>
        <DetailRows title="Payment" values={{ payment_reference: payment.payment_reference, payment_status: payment.payment_status, amount: moneyValue(payment.currency, payment.amount), payment_method: payment.payment_method, transaction_reference: payment.transaction_reference, paid_at: dateValue(payment.paid_at, true), verified_at: dateValue(payment.verified_at, true), created_at: dateValue(payment.createdAt || payment.created_at, true), failure_reason: payment.failure_reason, notes: payment.notes }} />
        <DetailRows title="Member / applicant" values={{ name: memberName(payment.user), email: payment.user?.email, phone: payment.user?.phone }} />
        <DetailRows title="Application" values={{ application_number: payment.application?.application_number, membership_type: payment.application?.membership_type, status: payment.application?.status, submitted_at: dateValue(payment.application?.submitted_at), approved_at: dateValue(payment.application?.approved_at) }} />
        <DetailRows title="Membership" values={{ membership_number: payment.membership?.membership_number, membership_type: payment.membership?.membership_type, status: payment.membership?.status, start_date: dateValue(payment.membership?.start_date), end_date: dateValue(payment.membership?.end_date) }} />
        {invoice && <DetailRows title="Invoice" values={{ invoice_number: invoice.invoice_number, status: invoice.status, membership_type: invoice.membership_type, subtotal: moneyValue(invoice.currency, invoice.subtotal), discount: moneyValue(invoice.currency, invoice.discount), total: moneyValue(invoice.currency, invoice.total), issued_at: dateValue(invoice.issued_at), due_at: dateValue(invoice.due_at), paid_at: dateValue(invoice.paid_at) }} />}
        {invoiceError && <div className="admin-payment-inline-error" role="status">Invoice detail endpoint could not be read: {invoiceError} The invoice fields returned with the payment are shown when available.</div>}
        {notice && <div className="admin-sample-notice" role="status">{notice}</div>}
        {actionError && <div className="admin-payment-error" role="alert">{actionError}</div>}
        {(canVerify && verificationAvailable || canReject && rejectionAvailable || canRefund && refundAvailable) && <>
          {canReject && rejectionAvailable && <label className="admin-application-remarks">Rejection reason<textarea value={failureReason} onChange={(event) => setFailureReason(event.target.value)} rows="2" maxLength="4000" placeholder="Required by the payment rejection workflow" disabled={actionLoading} /></label>}
          <label className="admin-application-remarks">Finance notes<textarea value={actionNotes} onChange={(event) => setActionNotes(event.target.value)} rows="2" maxLength="4000" placeholder="Optional notes" disabled={actionLoading} /></label>
          <div className="admin-sample-modal-actions">
            {canVerify && verificationAvailable && <button type="button" onClick={() => runPaymentAction('verify')} disabled={actionLoading}>{actionLoading ? 'Working…' : 'Verify payment'}</button>}
            {canReject && rejectionAvailable && <button type="button" onClick={() => runPaymentAction('reject')} disabled={actionLoading}>{actionLoading ? 'Working…' : 'Reject payment'}</button>}
            {canRefund && refundAvailable && !refundConfirm && <button type="button" onClick={() => setRefundConfirm(true)} disabled={actionLoading}>Refund payment</button>}
            {canRefund && refundAvailable && refundConfirm && <><span className="admin-payment-confirm-copy">Confirm refund? This updates the payment and related invoice through the backend.</span><button type="button" onClick={() => runPaymentAction('refund')} disabled={actionLoading}>{actionLoading ? 'Refunding…' : 'Confirm refund'}</button><button type="button" onClick={() => setRefundConfirm(false)} disabled={actionLoading}>Keep payment</button></>}
          </div>
        </>}
        {payment.payment_status === 'PAID' && <p className="admin-payment-state">Payment is verified. Membership activation remains a separate backend workflow.</p>}
      </>}
    </div></div>}
  </div></AdminLayout>
}
