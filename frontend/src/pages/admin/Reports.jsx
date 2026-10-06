import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Download, Search } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/context/AuthContext'
import { exportAdminReportCsvApi, getAdminReportApi } from '@/services/reportService'

const REPORT_TYPES = [
  { id: 'membership', label: 'Membership' },
  { id: 'applications', label: 'Applications' },
  { id: 'financial', label: 'Financial' },
]

const canAccess = (user, permissions) => {
  const role = user?.role?.name || user?.role
  return role === 'SUPER_ADMIN' || permissions.some((permission) => user?.permissions?.includes(permission))
}

const availableReports = (user) => REPORT_TYPES.filter((report) => {
  if (report.id === 'membership') return canAccess(user, ['members.read', 'membership.read'])
  if (report.id === 'applications') return canAccess(user, ['applications.read'])
  return canAccess(user, ['payments.read']) && canAccess(user, ['invoices.read'])
})

const humanize = (value) => String(value ?? '').replaceAll('_', ' ')

const errorMessage = (error) => {
  const status = error.response?.status
  if (status === 401) return 'Your session has expired. Sign in again to continue.'
  if (status === 403) return 'Your role does not have permission to access this report.'
  if (status === 400) return error.response?.data?.message || 'Check the selected date range.'
  if (!error.response) return 'The Reports API could not be reached. Check the connection and try again.'
  return error.response?.data?.message || 'The report request failed. Try again.'
}

const reportRows = (type, report) => {
  if (!report) return []
  if (type === 'membership') return [
    { label: 'Total memberships', count: report.total },
    ...report.byStatus.map((item) => ({ label: `Membership status · ${humanize(item.status)}`, count: item.count })),
    ...report.byType.map((item) => ({ label: `Membership type · ${humanize(item.membership_type)}`, count: item.count })),
  ]
  if (type === 'applications') return [
    { label: 'Total applications', count: report.total },
    ...report.byStatus.map((item) => ({ label: `Application status · ${humanize(item.status)}`, count: item.count })),
    ...report.byType.map((item) => ({ label: `Application type · ${humanize(item.membership_type)}`, count: item.count })),
  ]
  return [
    { label: 'Total payments', count: report.payments.total },
    ...report.payments.byStatus.map((item) => ({ label: `Payment · ${humanize(item.status)} · ${item.currency}`, count: item.count, amount: item.amount_total, currency: item.currency })),
    { label: 'Total invoices', count: report.invoices.total },
    ...report.invoices.byStatus.map((item) => ({ label: `Invoice · ${humanize(item.status)} · ${item.currency}`, count: item.count, amount: item.amount_total, currency: item.currency })),
  ]
}

const formatAmount = (currency, amount) => {
  if (amount === null || amount === undefined) return '—'
  const value = Number(amount)
  return `${currency || ''} ${Number.isNaN(value) ? amount : value.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim()
}

export default function Reports() {
  const { user } = useAuth()
  const reports = useMemo(() => availableReports(user), [user])
  const [reportType, setReportType] = useState(() => availableReports(user)[0]?.id || '')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [query, setQuery] = useState('')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const requestSequence = useRef(0)
  const requestLock = useRef(false)
  const exportLock = useRef(false)
  const filtersRef = useRef({ from: '', to: '' })
  const effectiveReportType = reports.some((item) => item.id === reportType) ? reportType : reports[0]?.id || ''

  const loadReport = useCallback(async () => {
    if (!effectiveReportType || requestLock.current) return
    const range = filtersRef.current
    setReport(null)
    setError('')
    setNotice('')
    if (Boolean(range.from) !== Boolean(range.to)) {
      setError('Choose both a start and end date, or clear both dates.')
      return
    }
    if (range.from && range.from > range.to) {
      setError('The start date must be on or before the end date.')
      return
    }

    const sequence = ++requestSequence.current
    requestLock.current = true
    setLoading(true)
    try {
      const params = range.from ? range : {}
      const response = await getAdminReportApi(effectiveReportType, params)
      if (sequence === requestSequence.current) setReport(response?.data || null)
    } catch (requestError) {
      if (sequence === requestSequence.current) setError(errorMessage(requestError))
    } finally {
      if (sequence === requestSequence.current) {
        requestLock.current = false
        setLoading(false)
      }
    }
  }, [effectiveReportType])

  useEffect(() => {
    if (effectiveReportType) loadReport()
  }, [effectiveReportType, loadReport])

  const clearReport = () => {
    requestSequence.current += 1
    requestLock.current = false
    setReport(null)
    setLoading(false)
    setError('')
  }

  const handleExport = async () => {
    if (!effectiveReportType || !report || exportLock.current || !canAccess(user, ['reports.export'])) return
    exportLock.current = true
    setExporting(true)
    setError('')
    setNotice('')
    try {
      const filters = report.filters?.from ? { from: report.filters.from, to: report.filters.to } : {}
      const blob = await exportAdminReportCsvApi(effectiveReportType, filters)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${effectiveReportType}-report.csv`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setNotice('CSV report downloaded.')
    } catch (exportError) {
      setError(errorMessage(exportError))
    } finally {
      exportLock.current = false
      setExporting(false)
    }
  }

  const rows = reportRows(effectiveReportType, report)
  const filteredRows = rows.filter((row) => `${row.label} ${row.count} ${row.amount || ''} ${row.currency || ''}`.toLowerCase().includes(query.toLowerCase()))
  const canExport = canAccess(user, ['reports.export'])

  return <AdminLayout><div className="admin-sample-module">
    <div className="admin-sample-title"><div><p className="admin-kicker"><span /> Admin workspace</p><h1>Reports &amp; Analytics</h1><p>Database summaries for membership, applications, and financial records.</p></div></div>
    {notice && <div className="admin-sample-notice" role="status"><span>{notice}</span></div>}
    {error && <div className="admin-payment-error" role="alert">{error}<button type="button" onClick={loadReport}>Try again</button></div>}
    {reports.length > 0 ? <>
      <form className="admin-sample-controls" onSubmit={(event) => { event.preventDefault(); loadReport() }}>
        <label><span>Report</span><select value={effectiveReportType} onChange={(event) => { clearReport(); setReportType(event.target.value) }} aria-label="Select report">{reports.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label><span>From</span><input type="date" value={from} onChange={(event) => { const value = event.target.value; filtersRef.current = { ...filtersRef.current, from: value }; clearReport(); setFrom(value) }} aria-label="From date" /></label>
        <label><span>To</span><input type="date" value={to} onChange={(event) => { const value = event.target.value; filtersRef.current = { ...filtersRef.current, to: value }; clearReport(); setTo(value) }} aria-label="To date" /></label>
        <label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search metrics..." aria-label="Search report metrics" /></label>
        <button className="admin-sample-primary" type="submit" disabled={loading}>{loading ? 'Loading…' : 'Generate report'}</button>
      </form>
      <p className="admin-report-date-note">Date ranges filter records by their creation date. Leave both dates blank to include all records.</p>
      <div className="admin-sample-table-wrap"><table className="admin-sample-table"><thead><tr><th>Metric</th><th>Records</th><th>Amount total</th></tr></thead><tbody>
        {loading ? <tr><td colSpan="3" className="admin-sample-empty" role="status">Loading report…</td></tr> : filteredRows.length ? filteredRows.map((row) => <tr key={row.label}><td data-label="Metric">{row.label}</td><td data-label="Records">{row.count}</td><td data-label="Amount total">{formatAmount(row.currency, row.amount)}</td></tr>) : <tr><td colSpan="3" className="admin-sample-empty">{report ? (rows.length ? 'No metrics match your search.' : 'No records were found for this date range.') : 'Generate a report to view database results.'}</td></tr>}
      </tbody></table></div>
      <div className="admin-sample-pagination"><span>{report ? `${filteredRows.length} of ${rows.length} report metrics` : 'No report loaded'}</span><button type="button" className="admin-sample-button" onClick={handleExport} disabled={!report || loading || exporting || !canExport}><Download size={14} />{exporting ? 'Exporting…' : 'Export CSV'}</button></div>
    </> : <section className="admin-sample-table-wrap"><div className="admin-sample-empty" role="status">No report types are available to this role. Membership, application, and financial reports require their corresponding domain permissions. Event report data is not available in this backend.</div></section>}
    <p className="admin-report-unavailable-note">Event reports are unavailable because this backend has no event or registration data models.</p>
  </div></AdminLayout>
}
