import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, Search, X } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/context/AuthContext'
import {
  cancelMembershipApi,
  getAdminMembershipByIdApi,
  getAdminMembershipsApi,
  processExpiredMembershipsApi,
  reactivateMembershipApi,
  suspendMembershipApi,
} from '@/services/memberService'

const PAGE_SIZE = 10
const MEMBERSHIP_STATUSES = ['PENDING', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED']
const MEMBERSHIP_TYPES = ['INDIVIDUAL', 'CORPORATE']
const humanize = (value) => String(value ?? '').replaceAll('_', ' ')
const displayValue = (value) => value === null || value === undefined || value === '' ? '—' : String(value)
const dateValue = (value) => value ? new Date(value).toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const memberName = (user) => [user?.first_name, user?.last_name].filter(Boolean).join(' ') || '—'
const errorMessage = (error, subject) => {
  const status = error.response?.status
  if (status === 401) return 'Your session has expired. Sign in again to continue.'
  if (status === 403) return 'You do not have permission to access this member workflow.'
  if (status === 404) return `${subject} was not found.`
  if (status === 409 || status === 400) return error.response?.data?.message || 'The request could not be completed.'
  if (!error.response) return 'The API could not be reached. Check the connection and try again.'
  return error.response?.data?.message || 'The request failed. Try again.'
}

const hasPermission = (user, permission) => {
  const roleName = user?.role?.name || user?.role
  return roleName === 'SUPER_ADMIN' || user?.permissions?.includes(permission)
}

function DetailRows({ title, values }) {
  const entries = Object.entries(values || {}).filter(([, value]) => value !== null && value !== undefined && value !== '')
  if (!entries.length) return null
  return <section className="admin-member-detail-section"><h3>{title}</h3><dl>{entries.map(([key, value]) => <React.Fragment key={key}><dt>{humanize(key)}</dt><dd>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd></React.Fragment>)}</dl></section>
}

export default function Members() {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
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
  const [suspendTarget, setSuspendTarget] = useState(null)
  const [suspendReason, setSuspendReason] = useState('')
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [expiryLoading, setExpiryLoading] = useState(false)
  const requestSequence = useRef(0)
  const detailSequence = useRef(0)
  const actionLock = useRef(false)

  const loadMembers = useCallback(async () => {
    const sequence = ++requestSequence.current
    setLoading(true)
    setListError('')
    try {
      const response = await getAdminMembershipsApi({
        page,
        limit: PAGE_SIZE,
        ...(status ? { status } : {}),
        ...(membershipType ? { membership_type: membershipType } : {}),
        ...(query.trim() ? { search: query.trim() } : {}),
      })
      if (sequence !== requestSequence.current) return
      const data = response?.data || {}
      setMembers(Array.isArray(data.memberships) ? data.memberships : [])
      setTotal(Number(data.total) || 0)
      setTotalPages(Math.max(Number(data.totalPages) || 1, 1))
    } catch (error) {
      if (sequence === requestSequence.current) {
        setMembers([])
        setTotal(0)
        setTotalPages(1)
        setListError(errorMessage(error, 'Members'))
      }
    } finally {
      if (sequence === requestSequence.current) setLoading(false)
    }
  }, [page, status, membershipType, query])

  useEffect(() => {
    const timer = window.setTimeout(loadMembers, query ? 300 : 0)
    return () => window.clearTimeout(timer)
  }, [loadMembers, query])

  const loadDetail = useCallback(async (id) => {
    const sequence = ++detailSequence.current
    setSelectedId(id)
    setDetail(null)
    setDetailError('')
    setActionError('')
    setDetailLoading(true)
    try {
      const response = await getAdminMembershipByIdApi(id)
      if (sequence === detailSequence.current) setDetail(response?.data || null)
    } catch (error) {
      if (sequence === detailSequence.current) setDetailError(errorMessage(error, 'Member'))
    } finally {
      if (sequence === detailSequence.current) setDetailLoading(false)
    }
  }, [])

  const closeDetail = () => {
    detailSequence.current += 1
    setSelectedId(null)
    setDetail(null)
    setActionError('')
  }

  const runReactivate = async (membership) => {
    if (actionLock.current) return
    actionLock.current = true
    setActionLoading(true)
    setActionError('')
    setNotice('')
    try {
      const response = await reactivateMembershipApi(membership.id)
      setNotice(response?.message || 'Membership reactivated.')
      await Promise.all([loadMembers(), selectedId === membership.id ? loadDetail(membership.id) : Promise.resolve()])
    } catch (error) {
      setActionError(errorMessage(error, 'Membership'))
    } finally {
      actionLock.current = false
      setActionLoading(false)
    }
  }

  const runSuspend = async () => {
    if (!suspendTarget || actionLock.current) return
    if (!suspendReason.trim()) {
      setActionError('Enter a reason before suspending this membership.')
      return
    }
    actionLock.current = true
    setActionLoading(true)
    setActionError('')
    setNotice('')
    try {
      const response = await suspendMembershipApi(suspendTarget.id, suspendReason.trim())
      setNotice(response?.message || 'Membership suspended.')
      const targetId = suspendTarget.id
      setSuspendTarget(null)
      setSuspendReason('')
      await Promise.all([loadMembers(), selectedId === targetId ? loadDetail(targetId) : Promise.resolve()])
    } catch (error) {
      setActionError(errorMessage(error, 'Membership'))
    } finally {
      actionLock.current = false
      setActionLoading(false)
    }
  }

  const runCancel = async () => {
    if (!cancelTarget || actionLock.current) return
    if (!cancelReason.trim()) {
      setActionError('Enter a reason before cancelling this membership.')
      return
    }
    actionLock.current = true
    setActionLoading(true)
    setActionError('')
    setNotice('')
    try {
      const response = await cancelMembershipApi(cancelTarget.id, cancelReason.trim())
      setNotice(response?.message || 'Membership cancelled.')
      const targetId = cancelTarget.id
      setCancelTarget(null)
      setCancelReason('')
      await Promise.all([loadMembers(), selectedId === targetId ? loadDetail(targetId) : Promise.resolve()])
    } catch (error) {
      setActionError(errorMessage(error, 'Membership'))
    } finally {
      actionLock.current = false
      setActionLoading(false)
    }
  }

  const runProcessExpiry = async () => {
    if (actionLock.current || expiryLoading) return
    actionLock.current = true
    setExpiryLoading(true)
    setActionError('')
    setNotice('')
    try {
      const response = await processExpiredMembershipsApi()
      setNotice(response?.message || 'Expired memberships processed successfully.')
      await loadMembers()
    } catch (error) {
      setActionError(errorMessage(error, 'Process Expiry'))
    } finally {
      actionLock.current = false
      setExpiryLoading(false)
    }
  }

  const canManage = hasPermission(user, 'membership.manage')
  const membership = detail?.membership
  const individualProfile = detail?.profiles?.individual
  const corporateProfile = detail?.profiles?.corporate
  const application = membership?.application
  const profileContacts = Array.isArray(corporateProfile?.representatives)
    ? corporateProfile.representatives.map(({ name, email, phone, designation, status }) => ({ name, email, phone, designation, status }))
    : null

  return <AdminLayout><div className="admin-sample-module admin-members-module">
    <div className="admin-sample-title">
      <div>
        <p className="admin-kicker"><span /> Admin workspace</p>
        <h1>Memberships Directory</h1>
        <p>Search and manage membership records from the database.</p>
      </div>
      {canManage && (
        <button
          type="button"
          onClick={runProcessExpiry}
          className="admin-sample-button"
          disabled={expiryLoading || loading}
          title="Scan and transition active memberships that passed their end date to EXPIRED"
        >
          {expiryLoading ? 'Processing…' : 'Process Expiry'}
        </button>
      )}
    </div>
    {notice && <div className="admin-sample-notice" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss message"><X size={16} /></button></div>}
    {actionError && !suspendTarget && !cancelTarget && <div className="admin-application-error" role="alert">{actionError}</div>}
    <div className="admin-sample-controls">
      <label><Search size={16} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search memberships..." aria-label="Search memberships" /></label>
      <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} aria-label="Filter by membership status"><option value="">All statuses</option>{MEMBERSHIP_STATUSES.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}</select>
      <select value={membershipType} onChange={(event) => { setMembershipType(event.target.value); setPage(1) }} aria-label="Filter by membership type"><option value="">All membership types</option>{MEMBERSHIP_TYPES.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}</select>
    </div>
    {listError && <div className="admin-application-error" role="alert">{listError}<button type="button" onClick={loadMembers}>Try again</button></div>}
    <div className="admin-sample-table-wrap"><table className="admin-sample-table"><thead><tr><th>Member</th><th>Email</th><th>Company</th><th>Designation</th><th>Type</th><th>Membership no.</th><th>Status</th><th>Application</th><th>Start date</th><th>End date</th><th aria-label="Actions">Actions</th></tr></thead><tbody>
      {loading ? <tr><td colSpan="11" className="admin-sample-empty" role="status">Loading memberships…</td></tr> : members.length ? members.map((item) => <tr key={item.id}>
        <td data-label="Member">{memberName(item.user)}</td><td data-label="Email">{displayValue(item.user?.email)}</td><td data-label="Company">{displayValue(item.company)}</td><td data-label="Designation">{displayValue(item.designation)}</td>
        <td data-label="Type">{humanize(item.membership_type)}</td><td data-label="Membership no.">{displayValue(item.membership_number)}</td>
        <td data-label="Status"><span className={`admin-sample-status status-${String(item.effective_status || item.status || '').toLowerCase().replaceAll('_', '-')}`}>{humanize(item.effective_status || item.status)}</span></td>
        <td data-label="Application">{humanize(item.application?.status || '—')}</td>
        <td data-label="Start date">{dateValue(item.start_date)}</td><td data-label="End date">{dateValue(item.end_date)}</td>
        <td data-label="Actions"><div className="admin-sample-actions">
          <button onClick={() => loadDetail(item.id)} className="admin-sample-view"><Eye size={14} /> View</button>
          {canManage && (item.effective_status || item.status) === 'ACTIVE' && <button onClick={() => { setSuspendTarget(item); setSuspendReason(''); setActionError('') }} className="admin-sample-button" disabled={actionLoading}>Suspend</button>}
          {canManage && (item.effective_status || item.status) === 'SUSPENDED' && <button onClick={() => runReactivate(item)} className="admin-sample-button" disabled={actionLoading}>{actionLoading ? 'Working…' : 'Reactivate'}</button>}
          {canManage && ['ACTIVE', 'SUSPENDED', 'PENDING'].includes(item.effective_status || item.status) && <button onClick={() => { setCancelTarget(item); setCancelReason(''); setActionError('') }} className="admin-sample-button" disabled={actionLoading}>Cancel</button>}
        </div></td>
      </tr>) : <tr><td colSpan="11" className="admin-sample-empty">{total === 0 && !query && !status && !membershipType ? 'No memberships found.' : 'No memberships match these filters.'}</td></tr>}
    </tbody></table></div>
    <div className="admin-sample-pagination"><span>{loading ? 'Loading records' : `${total} member${total === 1 ? '' : 's'}${totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ''}`}</span><div><button disabled={loading || page <= 1} onClick={() => setPage((current) => Math.max(current - 1, 1))}>Previous</button><button disabled={loading || page >= totalPages} onClick={() => setPage((current) => Math.min(current + 1, totalPages))}>Next</button></div></div>

    {selectedId !== null && <div className="admin-sample-modal" role="dialog" aria-modal="true" aria-label="Member detail"><div>
      <button className="admin-sample-modal-close" onClick={closeDetail} aria-label="Close member details"><X size={18} /></button>
      <p className="admin-kicker"><span /> Member detail</p>
      {detailLoading ? <p className="admin-application-state" role="status">Loading member details…</p> : detailError ? <div className="admin-application-error" role="alert">{detailError}<button type="button" onClick={() => loadDetail(selectedId)}>Try again</button></div> : membership && <>
        <h2>{memberName(membership.user)}</h2>
        <DetailRows title="Member" values={{ email: membership.user?.email, phone: membership.user?.phone, account_status: membership.user?.status }} />
        <DetailRows title="Membership" values={{ membership_number: membership.membership_number, membership_type: membership.membership_type, status: membership.status, effective_status: membership.effective_status, start_date: membership.start_date, end_date: membership.end_date, activated_at: membership.activated_at, suspended_at: membership.suspended_at, cancelled_at: membership.cancelled_at, created_at: membership.created_at, updated_at: membership.updated_at }} />
        <DetailRows title="Individual profile" values={{ company: individualProfile?.company, designation: individualProfile?.designation, biography: individualProfile?.biography, linkedin_url: individualProfile?.linkedin_url }} />
        <DetailRows title="Corporate profile" values={{ company_name: corporateProfile?.company_name, company_description: corporateProfile?.company_description, website: corporateProfile?.website, contact_email: corporateProfile?.contact_email, contact_phone: corporateProfile?.contact_phone, invoicing_contact_person: corporateProfile?.invoicing_contact_person, representatives: profileContacts }} />
        <DetailRows title="Application" values={{ application_number: application?.application_number, membership_type: application?.membership_type, status: application?.status, submitted_at: application?.submitted_at, approved_at: application?.approved_at }} />
        {Array.isArray(detail.statusHistory) && detail.statusHistory.length > 0 && <section className="admin-member-detail-section"><h3>Membership history</h3><ul className="admin-application-history">{detail.statusHistory.map((entry) => <li key={entry.id}><strong>{humanize(entry.old_status || 'NEW')} → {humanize(entry.new_status)}</strong><span>{dateValue(entry.created_at)}{entry.changedByUser ? ` · ${memberName(entry.changedByUser)}` : ''}</span>{entry.reason && <p>{entry.reason}</p>}</li>)}</ul></section>}
        {notice && <div className="admin-sample-notice" role="status">{notice}</div>}
        {actionError && <div className="admin-application-error" role="alert">{actionError}</div>}
        {canManage && (
          <div className="admin-sample-modal-actions">
            {(membership.effective_status || membership.status) === 'SUSPENDED' && <button type="button" onClick={() => runReactivate(membership)} disabled={actionLoading}>{actionLoading ? 'Working…' : 'Reactivate membership'}</button>}
            {(membership.effective_status || membership.status) === 'ACTIVE' && <button type="button" onClick={() => { setSuspendTarget(membership); setSuspendReason(''); setActionError('') }} disabled={actionLoading}>Suspend membership</button>}
            {['ACTIVE', 'SUSPENDED', 'PENDING'].includes(membership.effective_status || membership.status) && <button type="button" onClick={() => { setCancelTarget(membership); setCancelReason(''); setActionError('') }} disabled={actionLoading}>Cancel membership</button>}
          </div>
        )}
      </>}
    </div></div>}

    {suspendTarget && <div className="admin-sample-modal" role="dialog" aria-modal="true" aria-label="Suspend membership"><div>
      <button className="admin-sample-modal-close" onClick={() => { setSuspendTarget(null); setActionError('') }} aria-label="Close suspension dialog"><X size={18} /></button>
      <p className="admin-kicker"><span /> Membership action</p><h2>Suspend {memberName(suspendTarget.user)}?</h2>
      <p className="admin-application-state">Enter the reason for suspending membership. The backend validates and records this action.</p>
      <label className="admin-application-remarks">Reason<textarea value={suspendReason} onChange={(event) => setSuspendReason(event.target.value)} rows="3" maxLength="4000" disabled={actionLoading} /></label>
      {actionError && <div className="admin-application-error" role="alert">{actionError}</div>}
      <div className="admin-sample-modal-actions"><button type="button" onClick={() => { setSuspendTarget(null); setActionError('') }} disabled={actionLoading}>Cancel</button><button type="button" onClick={runSuspend} disabled={actionLoading}>{actionLoading ? 'Working…' : 'Suspend membership'}</button></div>
    </div></div>}

    {cancelTarget && <div className="admin-sample-modal" role="dialog" aria-modal="true" aria-label="Cancel membership"><div>
      <button className="admin-sample-modal-close" onClick={() => { setCancelTarget(null); setActionError('') }} aria-label="Close cancellation dialog"><X size={18} /></button>
      <p className="admin-kicker"><span /> Membership action</p><h2>Cancel {memberName(cancelTarget.user)}?</h2>
      <p className="admin-application-state">Enter the reason for cancelling this membership. The backend validates and records this action.</p>
      <label className="admin-application-remarks">Cancellation Reason<textarea value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} rows="3" maxLength="4000" disabled={actionLoading} /></label>
      {actionError && <div className="admin-application-error" role="alert">{actionError}</div>}
      <div className="admin-sample-modal-actions"><button type="button" onClick={() => { setCancelTarget(null); setActionError('') }} disabled={actionLoading}>Back</button><button type="button" onClick={runCancel} disabled={actionLoading}>{actionLoading ? 'Working…' : 'Confirm cancellation'}</button></div>
    </div></div>}
  </div></AdminLayout>
}
