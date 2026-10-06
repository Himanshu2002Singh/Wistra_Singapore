import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, Search, X } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getAdminAuditLogByIdApi, getAdminAuditLogsApi } from '@/services/adminAuditLogService'

const PAGE_SIZE = 20
const humanize = (value) => String(value ?? '').replaceAll('_', ' ')
const dateValue = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-SG', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}
const actorName = (user) => [user?.first_name, user?.last_name].filter(Boolean).join(' ') || '—'
const errorMessage = (error, subject) => {
  const status = error.response?.status
  if (status === 401) return 'Your session has expired. Sign in again to continue.'
  if (status === 403) return 'You do not have permission to view audit logs.'
  if (status === 404) return `${subject} was not found.`
  if (status === 400) return error.response?.data?.message || 'The filter values are invalid.'
  if (!error.response) return 'The Admin Audit Logs API could not be reached. Check the connection and try again.'
  return error.response?.data?.message || 'The request failed. Try again.'
}

function DetailRow({ label, children }) {
  return <><dt>{label}</dt><dd>{children || '—'}</dd></>
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [module, setModule] = useState('')
  const [action, setAction] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [modules, setModules] = useState([])
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const listSequence = useRef(0)
  const detailSequence = useRef(0)

  const loadLogs = useCallback(async () => {
    const sequence = ++listSequence.current
    setLoading(true)
    setListError('')
    try {
      const response = await getAdminAuditLogsApi({
        page,
        limit: PAGE_SIZE,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(module ? { module } : {}),
        ...(action ? { action } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      })
      if (sequence !== listSequence.current) return
      const data = response?.data || {}
      setLogs(Array.isArray(data.logs) ? data.logs : [])
      setTotal(Number(data.total) || 0)
      setTotalPages(Math.max(Number(data.totalPages) || 1, 1))
      setModules(Array.isArray(data.filters?.modules) ? data.filters.modules : [])
      setActions(Array.isArray(data.filters?.actions) ? data.filters.actions : [])
    } catch (error) {
      if (sequence === listSequence.current) {
        setLogs([])
        setTotal(0)
        setTotalPages(1)
        setListError(errorMessage(error, 'Audit logs'))
      }
    } finally {
      if (sequence === listSequence.current) setLoading(false)
    }
  }, [page, search, module, action, from, to])

  useEffect(() => {
    const timer = window.setTimeout(loadLogs, search ? 300 : 0)
    return () => window.clearTimeout(timer)
  }, [loadLogs, search])

  const loadDetail = useCallback(async (id) => {
    const sequence = ++detailSequence.current
    setSelectedId(id)
    setDetail(null)
    setDetailError('')
    setDetailLoading(true)
    try {
      const response = await getAdminAuditLogByIdApi(id)
      if (sequence === detailSequence.current) setDetail(response?.data || null)
    } catch (error) {
      if (sequence === detailSequence.current) setDetailError(errorMessage(error, 'Audit log'))
    } finally {
      if (sequence === detailSequence.current) setDetailLoading(false)
    }
  }, [])

  const closeDetail = () => {
    detailSequence.current += 1
    setSelectedId(null)
    setDetail(null)
    setDetailError('')
  }

  const resetFilters = () => {
    setSearch('')
    setModule('')
    setAction('')
    setFrom('')
    setTo('')
    setPage(1)
  }

  return <AdminLayout><div className="admin-sample-module">
    <div className="admin-sample-title"><div><p className="admin-kicker"><span /> Admin workspace</p><h1>Audit Logs</h1><p>Read-only history of actions recorded by the backend.</p></div></div>
    <div className="admin-sample-controls">
      <label><Search size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search action, actor, entity..." aria-label="Search audit logs" /></label>
      <select value={module} onChange={(event) => { setModule(event.target.value); setPage(1) }} aria-label="Filter by module"><option value="">All modules</option>{modules.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}</select>
      <select value={action} onChange={(event) => { setAction(event.target.value); setPage(1) }} aria-label="Filter by action"><option value="">All actions</option>{actions.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}</select>
      <label className="admin-audit-date-filter"><span>From</span><input type="date" value={from} max={to || undefined} onChange={(event) => { setFrom(event.target.value); setPage(1) }} aria-label="From date" /></label>
      <label className="admin-audit-date-filter"><span>To</span><input type="date" value={to} min={from || undefined} onChange={(event) => { setTo(event.target.value); setPage(1) }} aria-label="To date" /></label>
      <button type="button" className="admin-audit-reset" onClick={resetFilters}>Reset</button>
    </div>
    {listError && <div className="admin-payment-error" role="alert">{listError}<button type="button" onClick={loadLogs}>Try again</button></div>}
    <div className="admin-sample-table-wrap"><table className="admin-sample-table"><thead><tr><th>Audit ID</th><th>Timestamp</th><th>Actor</th><th>Role</th><th>Action</th><th>Module</th><th>Entity</th><th aria-label="Actions">Details</th></tr></thead><tbody>
      {loading ? <tr><td colSpan="8" className="admin-sample-empty" role="status">Loading audit logs…</td></tr> : logs.length ? logs.map((log) => <tr key={log.id}>
        <td data-label="Audit ID">{log.id}</td><td data-label="Timestamp">{dateValue(log.created_at)}</td><td data-label="Actor">{actorName(log.user)}</td><td data-label="Role">{humanize(log.user?.role?.name) || '—'}</td>
        <td data-label="Action">{humanize(log.action)}</td><td data-label="Module">{humanize(log.module)}</td><td data-label="Entity">{log.entity_type ? `${humanize(log.entity_type)}${log.entity_id ? ` · ${log.entity_id}` : ''}` : '—'}</td>
        <td data-label="Details"><div className="admin-sample-actions"><button type="button" onClick={() => loadDetail(log.id)} className="admin-sample-view"><Eye size={14} /> View</button></div></td>
      </tr>) : <tr><td colSpan="8" className="admin-sample-empty">{total ? 'No audit logs match these filters.' : 'No audit logs found.'}</td></tr>}
    </tbody></table></div>
    <div className="admin-sample-pagination"><span>{loading ? 'Loading records' : `${total} audit log${total === 1 ? '' : 's'}${totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ''}`}</span><div><button type="button" disabled={loading || page <= 1} onClick={() => setPage((current) => Math.max(current - 1, 1))}>Previous</button><button type="button" disabled={loading || page >= totalPages} onClick={() => setPage((current) => Math.min(current + 1, totalPages))}>Next</button></div></div>

    {selectedId !== null && <div className="admin-sample-modal" role="dialog" aria-modal="true" aria-label="Audit log details"><div>
      <button className="admin-sample-modal-close" type="button" onClick={closeDetail} aria-label="Close audit details"><X size={18} /></button><p className="admin-kicker"><span /> Audit detail</p>
      {detailLoading ? <p className="admin-user-detail-state" role="status">Loading audit details…</p> : detailError ? <div className="admin-payment-error" role="alert">{detailError}<button type="button" onClick={() => loadDetail(selectedId)}>Try again</button></div> : detail && <>
        <h2>{humanize(detail.action)}</h2><dl className="admin-audit-detail-list">
          <DetailRow label="Audit ID">{detail.id}</DetailRow><DetailRow label="Timestamp">{dateValue(detail.created_at)}</DetailRow>
          <DetailRow label="Actor">{actorName(detail.user)}</DetailRow><DetailRow label="Actor ID">{detail.user_id}</DetailRow>
          <DetailRow label="Actor role">{humanize(detail.user?.role?.name)}</DetailRow><DetailRow label="Action">{humanize(detail.action)}</DetailRow>
          <DetailRow label="Module">{humanize(detail.module)}</DetailRow><DetailRow label="Entity type">{humanize(detail.entity_type)}</DetailRow>
          <DetailRow label="Entity ID">{detail.entity_id}</DetailRow>
        </dl><p className="admin-user-detail-state">Stored change payloads, IP addresses, and user-agent data are not included in this response.</p>
      </>}
      <div className="admin-sample-modal-actions"><button type="button" onClick={closeDetail}>Close</button></div>
    </div></div>}
  </div></AdminLayout>
}
