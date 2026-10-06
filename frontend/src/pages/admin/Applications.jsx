import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, Search, X } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/context/AuthContext'
import {
  approveApplicationApi,
  getAdminApplicationByIdApi,
  getAdminApplicationsApi,
  rejectApplicationApi,
  requestClarificationApi,
  reviewApplicationApi,
} from '@/services/membershipService'

const PAGE_SIZE = 10
const STATUSES = [
  'DRAFT',
  'PENDING',
  'UNDER_REVIEW',
  'CLARIFICATION_REQUIRED',
  'APPROVED',
  'REJECTED',
  'PAYMENT_PENDING',
]

const humanize = (value) => String(value ?? '').replaceAll('_', ' ')
const dateValue = (value) => value ? new Date(value).toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const applicantName = (applicant) => [applicant?.first_name, applicant?.last_name].filter(Boolean).join(' ') || '—'
const errorMessage = (error, subject) => {
  const status = error.response?.status
  if (status === 401) return 'Your session has expired. Sign in again to continue.'
  if (status === 403) return 'You do not have permission to access this application workflow.'
  if (status === 404) return `${subject} was not found.`
  if (status === 409 || status === 400) return error.response?.data?.message || 'The request could not be completed.'
  if (!error.response) return 'The API could not be reached. Check the connection and try again.'
  return error.response?.data?.message || 'The request failed. Try again.'
}

const hasPermission = (user, ...permissions) => {
  const roleName = user?.role?.name || user?.role
  return roleName === 'SUPER_ADMIN' || permissions.some((permission) => user?.permissions?.includes(permission))
}

function DetailRows({ title, values }) {
  const entries = Object.entries(values || {}).filter(([, value]) => value !== null && value !== undefined && value !== '')
  if (!entries.length) return null
  return <section className="admin-application-detail-section"><h3>{title}</h3><dl>{entries.map(([key, value]) => <React.Fragment key={key}><dt>{humanize(key)}</dt><dd>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd></React.Fragment>)}</dl></section>
}

export default function Applications() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [membershipType, setMembershipType] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [notice, setNotice] = useState('')
  const [remarks, setRemarks] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const requestSequence = useRef(0)
  const detailSequence = useRef(0)
  const actionLock = useRef(false)

  const loadApplications = useCallback(async () => {
    const sequence = ++requestSequence.current
    setLoading(true)
    setListError('')
    try {
      const response = await getAdminApplicationsApi({
        page,
        limit: PAGE_SIZE,
        ...(status ? { status } : {}),
        ...(membershipType ? { membership_type: membershipType } : {}),
        ...(query.trim() ? { search: query.trim() } : {}),
      })
      if (sequence !== requestSequence.current) return
      const data = response?.data || {}
      setApplications(Array.isArray(data.applications) ? data.applications : [])
      setTotal(Number(data.total) || 0)
      setTotalPages(Math.max(Number(data.totalPages) || 1, 1))
    } catch (error) {
      if (sequence === requestSequence.current) {
        setApplications([])
        setTotal(0)
        setTotalPages(1)
        setListError(errorMessage(error, 'Applications'))
      }
    } finally {
      if (sequence === requestSequence.current) setLoading(false)
    }
  }, [page, status, membershipType, query])

  useEffect(() => {
    const timer = window.setTimeout(loadApplications, query ? 300 : 0)
    return () => window.clearTimeout(timer)
  }, [loadApplications, query])

  const loadDetail = useCallback(async (id) => {
    const sequence = ++detailSequence.current
    setSelectedId(id)
    setDetail(null)
    setDetailError('')
    setActionError('')
    setRemarks('')
    setDetailLoading(true)
    try {
      const response = await getAdminApplicationByIdApi(id)
      if (sequence === detailSequence.current) setDetail(response?.data || null)
    } catch (error) {
      if (sequence === detailSequence.current) setDetailError(errorMessage(error, 'Application'))
    } finally {
      if (sequence === detailSequence.current) setDetailLoading(false)
    }
  }, [])

  const closeDetail = () => {
    detailSequence.current += 1
    setSelectedId(null)
    setDetail(null)
    setActionError('')
    setNotice('')
  }

  const runAction = async (action) => {
    if (!detail?.application || actionLock.current) return
    const id = detail.application.id
    if ((action === 'reject' || action === 'clarification') && !remarks.trim()) {
      setActionError(action === 'reject' ? 'Enter a reason before rejecting this application.' : 'Enter the clarification requested from the applicant.')
      return
    }
    actionLock.current = true
    setActionLoading(true)
    setActionError('')
    setNotice('')
    try {
      if (action === 'review') await reviewApplicationApi(id)
      if (action === 'approve') await approveApplicationApi(id, remarks.trim())
      if (action === 'reject') await rejectApplicationApi(id, remarks.trim())
      if (action === 'clarification') await requestClarificationApi(id, remarks.trim())
      const label = action === 'clarification' ? 'Clarification requested' : action === 'review' ? 'Application moved under review' : action === 'approve' ? 'Application approved and moved to payment pending' : 'Application rejected'
      setNotice(`${label}.`)
      await Promise.all([loadDetail(id), loadApplications()])
    } catch (error) {
      setActionError(errorMessage(error, 'Action'))
    } finally {
      actionLock.current = false
      setActionLoading(false)
    }
  }

  const canReview = hasPermission(user, 'applications.manage', 'applications.approve')
  const canReject = hasPermission(user, 'applications.manage', 'applications.reject')
  const canClarify = hasPermission(user, 'applications.manage')
  const application = detail?.application
  // The backend remains authoritative and rejects invalid state transitions.
  const isActionable = application && ['PENDING', 'UNDER_REVIEW', 'CLARIFICATION_REQUIRED'].includes(application.status)
  const canMoveToReview = canReview && ['PENDING', 'CLARIFICATION_REQUIRED'].includes(application?.status)
  const canDecide = application?.status === 'UNDER_REVIEW'

  return <AdminLayout><div className="admin-sample-module admin-applications-module">
    <div className="admin-sample-title"><div><p className="admin-kicker"><span /> Admin workspace</p><h1>Membership Applications</h1><p>Review membership applications and applicant details.</p></div></div>
    {notice && <div className="admin-sample-notice" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss message"><X size={16} /></button></div>}
    <div className="admin-sample-controls">
      <label><Search size={16} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search applications..." aria-label="Search applications" /></label>
      <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} aria-label="Filter by application status"><option value="">All statuses</option>{STATUSES.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}</select>
      <select value={membershipType} onChange={(event) => { setMembershipType(event.target.value); setPage(1) }} aria-label="Filter by membership type"><option value="">All membership types</option><option value="INDIVIDUAL">Individual</option><option value="CORPORATE">Corporate</option></select>
    </div>
    {listError && <div className="admin-application-error" role="alert">{listError}<button type="button" onClick={loadApplications}>Try again</button></div>}
    <div className="admin-sample-table-wrap"><table className="admin-sample-table"><thead><tr><th>Applicant</th><th>Email</th><th>Membership type</th><th>Application ID</th><th>Submitted</th><th>Updated</th><th>Status</th><th aria-label="Actions">Actions</th></tr></thead><tbody>
      {loading ? <tr><td colSpan="8" className="admin-sample-empty" role="status">Loading applications…</td></tr> : applications.length ? applications.map((item) => <tr key={item.id}>
        <td data-label="Applicant">{applicantName(item.applicant)}</td>
        <td data-label="Email">{item.applicant?.email || '—'}</td>
        <td data-label="Membership type">{humanize(item.membership_type)}</td>
        <td data-label="Application ID">{item.application_number || item.id}</td>
        <td data-label="Submitted">{dateValue(item.submitted_at)}</td>
        <td data-label="Updated">{dateValue(item.updated_at)}</td>
        <td data-label="Status"><span className={`admin-sample-status status-${String(item.status || '').toLowerCase().replaceAll('_', '-')}`}>{humanize(item.status)}</span></td>
        <td data-label="Actions"><div className="admin-sample-actions"><button onClick={() => loadDetail(item.id)} className="admin-sample-view"><Eye size={14} /> View</button></div></td>
      </tr>) : <tr><td colSpan="8" className="admin-sample-empty">{total === 0 && !query && !status && !membershipType ? 'No applications found.' : 'No applications match these filters.'}</td></tr>}
    </tbody></table></div>
    <div className="admin-sample-pagination"><span>{loading ? 'Loading records' : `${total} application${total === 1 ? '' : 's'}${totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ''}`}</span><div><button disabled={loading || page <= 1} onClick={() => setPage((current) => Math.max(current - 1, 1))}>Previous</button><button disabled={loading || page >= totalPages} onClick={() => setPage((current) => Math.min(current + 1, totalPages))}>Next</button></div></div>

    {selectedId !== null && <div className="admin-sample-modal" role="dialog" aria-modal="true" aria-label="Application detail"><div>
      <button className="admin-sample-modal-close" onClick={closeDetail} aria-label="Close application details"><X size={18} /></button>
      <p className="admin-kicker"><span /> Application detail</p>
      {detailLoading ? <p className="admin-application-state" role="status">Loading application details…</p> : detailError ? <div className="admin-application-error" role="alert">{detailError}<button type="button" onClick={() => loadDetail(selectedId)}>Try again</button></div> : application && <>
        <h2>{applicantName(application.applicant)}</h2>
        <DetailRows title="Application" values={application} />
        <DetailRows title="Applicant" values={application.applicant} />
        <DetailRows title="Individual profile" values={detail.profiles?.individual} />
        <DetailRows title="Corporate profile" values={detail.profiles?.corporate} />
        {Array.isArray(detail.statusHistory) && detail.statusHistory.length > 0 && <section className="admin-application-detail-section"><h3>Status history</h3><ul className="admin-application-history">{detail.statusHistory.map((entry) => <li key={entry.id}><strong>{humanize(entry.old_status || 'NEW')} → {humanize(entry.new_status)}</strong><span>{dateValue(entry.created_at)}{entry.changedByUser ? ` · ${applicantName(entry.changedByUser)}` : ''}</span>{entry.reason && <p>{entry.reason}</p>}</li>)}</ul></section>}
        {notice && <div className="admin-sample-notice" role="status">{notice}</div>}
        {actionError && <div className="admin-application-error" role="alert">{actionError}</div>}
        {isActionable && <>
          {(canReject || canClarify) && <label className="admin-application-remarks">Review remarks<textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} rows="3" maxLength="4000" placeholder="Add a reason for rejection or clarification request" disabled={actionLoading} /></label>}
          <div className="admin-sample-modal-actions">
            {canMoveToReview && <button type="button" onClick={() => runAction('review')} disabled={actionLoading}>{actionLoading ? 'Working…' : 'Review'}</button>}
            {canDecide && canReview && <button type="button" onClick={() => runAction('approve')} disabled={actionLoading}>{actionLoading ? 'Working…' : 'Approve'}</button>}
            {canDecide && canReject && <button type="button" onClick={() => runAction('reject')} disabled={actionLoading}>{actionLoading ? 'Working…' : 'Reject'}</button>}
            {canDecide && canClarify && <button type="button" onClick={() => runAction('clarification')} disabled={actionLoading}>{actionLoading ? 'Working…' : 'Request clarification'}</button>}
          </div>
        </>}
        {application?.status === 'PAYMENT_PENDING' && <p className="admin-application-state">Payment is pending. Approval does not activate membership.</p>}
      </>}
    </div></div>}
  </div></AdminLayout>
}
