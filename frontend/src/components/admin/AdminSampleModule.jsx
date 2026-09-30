import React, { useMemo, useState } from 'react'
import { Download, Eye, Plus, Search, X } from 'lucide-react'
import AdminLayout from './AdminLayout'
import { adminApplications, adminAuditLogs, adminCommunications, adminEvents, adminMembers, adminPayments, adminReports, adminUsers } from '@/data/adminMockData'

const configs = {
  applications: { title: 'Membership Applications', intro: 'Sample frontend review queue. No backend changes are made.', rows: adminApplications, filter: ['All', 'Pending Review', 'Under Review', 'Approved', 'Rejected', 'Clarification Required'], columns: [['Applicant', 'name'], ['Type', 'type'], ['Company', 'company'], ['Submitted', 'submitted'], ['Status', 'status']] },
  members: { title: 'Members Directory', intro: 'Sample member records for the admin interface.', rows: adminMembers, filter: ['All', 'Active', 'Suspended'], columns: [['Member', 'name'], ['Type', 'type'], ['Company', 'company'], ['Membership no.', 'membershipNumber'], ['Status', 'status']] },
  payments: { title: 'Payments', intro: 'Sample payment activity. Amounts are illustrative only.', rows: adminPayments, filter: ['All', 'Pending Verification', 'Paid', 'Rejected'], columns: [['Reference', 'id'], ['Member', 'name'], ['Type', 'category'], ['Amount', 'amount'], ['Status', 'status']] },
  events: { title: 'Events', intro: 'Sample event programme and registration overview.', rows: adminEvents, filter: ['All', 'Upcoming', 'Past', 'Draft'], columns: [['Event', 'title'], ['Date', 'date'], ['Location', 'location'], ['Registration', 'registered'], ['Status', 'status']] },
  communications: { title: 'Communications', intro: 'Sample campaigns for interface review only. Nothing will be sent.', rows: adminCommunications, filter: ['All', 'Draft', 'Scheduled', 'Sent'], columns: [['Campaign', 'title'], ['Audience', 'audience'], ['Type', 'type'], ['Updated', 'updated'], ['Status', 'status']] },
  reports: { title: 'Reports & Analytics', intro: 'Sample report views and frontend-only export actions.', rows: adminReports, filter: ['All', 'Membership', 'Finance', 'Events', 'Applications'], columns: [['Report', 'title'], ['Type', 'type'], ['Generated', 'generated'], ['Description', 'description']] },
  users: { title: 'Users & Roles', intro: 'Sample administrator records. Role changes are local to this screen.', rows: adminUsers, filter: ['All', 'SUPER_ADMIN', 'MEMBERSHIP_ADMIN', 'FINANCE_ADMIN', 'EVENTS_ADMIN', 'COMMUNICATIONS_ADMIN'], columns: [['Administrator', 'name'], ['Email', 'email'], ['Role', 'role'], ['Last active', 'lastActive'], ['Status', 'status']] },
  audit: { title: 'Audit Logs', intro: 'Sample audit history for the upcoming audit-log module.', rows: adminAuditLogs, filter: ['All', 'Applications', 'Payments', 'Events'], columns: [['Timestamp', 'timestamp'], ['Actor', 'actor'], ['Action', 'action'], ['Module', 'module'], ['Status', 'status']] },
}

const formatValue = (value) => String(value || '').replaceAll('_', ' ')
const searchFields = (row) => Object.values(row).join(' ').toLowerCase()

export default function AdminSampleModule({ type }) {
  const config = configs[type]
  const [records, setRecords] = useState(config.rows)
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [notice, setNotice] = useState('')
  const [page, setPage] = useState(1)
  const filtered = useMemo(() => records.filter((row) => {
    const matchesQuery = searchFields(row).includes(query.toLowerCase())
    const filterValue = row.status || row.role || row.module || row.type
    return matchesQuery && (filter === 'All' || filterValue === filter)
  }), [records, query, filter])
  const pageRows = filtered.slice((page - 1) * 5, page * 5)

  const mutate = (id, changes, message) => {
    setRecords((current) => current.map((row) => row.id === id ? { ...row, ...changes } : row))
    setSelected((current) => current?.id === id ? { ...current, ...changes } : current)
    setNotice(message)
  }
  const createSample = () => {
    const id = `${type.slice(0, 3).toUpperCase()}-SAMPLE-${records.length + 1}`
    const templates = {
      events: { id, title: 'New sample event', date: '30 Nov 2026', location: 'Singapore', capacity: 100, registered: 0, status: 'Draft' },
      communications: { id, title: 'New sample campaign', audience: 'Selected members', type: 'Announcement', status: 'Draft', updated: 'Today', summary: 'Frontend-only sample communication.' },
      users: { id, name: 'New sample administrator', email: 'new.admin@wista.example', role: 'MEMBERSHIP_ADMIN', status: 'Active', lastActive: 'Not yet active' },
    }
    if (templates[type]) { setRecords((current) => [templates[type], ...current]); setNotice('Sample record created locally.') }
  }
  const sampleExport = () => setNotice('Sample export prepared in the interface only. No backend report was exported.')
  const renderAction = (row) => {
    if (type === 'applications') return <div className="flex flex-wrap justify-end gap-2"><button onClick={() => mutate(row.id, { status: 'Under Review' }, 'Sample application moved to review.')} className="admin-sample-button">Review</button><button onClick={() => mutate(row.id, { status: 'Approved' }, 'Sample application approved locally.')} className="admin-sample-button">Approve</button></div>
    if (type === 'payments' && row.status === 'Pending Verification') return <button onClick={() => mutate(row.id, { status: 'Paid' }, 'Sample payment marked as paid locally.')} className="admin-sample-button">Verify</button>
    if (type === 'members') return <button onClick={() => mutate(row.id, { status: row.status === 'Active' ? 'Suspended' : 'Active' }, 'Sample member status updated locally.')} className="admin-sample-button">{row.status === 'Active' ? 'Suspend' : 'Activate'}</button>
    if (type === 'communications') return <button onClick={() => mutate(row.id, { status: 'Scheduled' }, 'Sample campaign scheduled locally.')} className="admin-sample-button">Schedule</button>
    if (type === 'users') return <button onClick={() => mutate(row.id, { status: row.status === 'Active' ? 'Inactive' : 'Active' }, 'Sample user access updated locally.')} className="admin-sample-button">Toggle access</button>
    if (type === 'reports') return <button onClick={sampleExport} className="admin-sample-button"><Download size={13} /> Sample export</button>
    return <button onClick={() => setNotice('Sample action completed locally.')} className="admin-sample-button">Manage</button>
  }
  return <AdminLayout><div className="admin-sample-module">
    <div className="admin-sample-title"><div><p className="admin-kicker"><span /> Admin workspace</p><h1>{config.title}</h1><p>{config.intro}</p></div>{['events', 'communications', 'users'].includes(type) && <button className="admin-sample-primary" onClick={createSample}><Plus size={16} /> Add sample</button>}</div>
    {notice && <div className="admin-sample-notice"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss message"><X size={16} /></button></div>}
    <div className="admin-sample-controls"><label><Search size={16} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder={`Search ${config.title.toLowerCase()}...`} /></label><select value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1) }} aria-label="Filter records">{config.filter.map((item) => <option key={item}>{formatValue(item)}</option>)}</select></div>
    <div className="admin-sample-table-wrap"><table className="admin-sample-table"><thead><tr>{config.columns.map(([label]) => <th key={label}>{label}</th>)}<th aria-label="Actions">Actions</th></tr></thead><tbody>{pageRows.length ? pageRows.map((row) => <tr key={row.id}>{config.columns.map(([label, key]) => <td key={key} data-label={label}>{key === 'status' ? <span className={`admin-sample-status status-${String(row[key]).toLowerCase().replaceAll(' ', '-')}`}>{formatValue(row[key])}</span> : key === 'registered' ? `${row.registered} / ${row.capacity}` : formatValue(row[key])}</td>)}<td data-label="Actions"><div className="admin-sample-actions"><button onClick={() => setSelected(row)} className="admin-sample-view"><Eye size={14} /> View</button>{renderAction(row)}</div></td></tr>) : <tr><td colSpan={config.columns.length + 1} className="admin-sample-empty">No sample records match this view.</td></tr>}</tbody></table></div>
    <div className="admin-sample-pagination"><span>{filtered.length} sample record{filtered.length === 1 ? '' : 's'}</span><div><button disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Previous</button><button disabled={page * 5 >= filtered.length} onClick={() => setPage((current) => current + 1)}>Next</button></div></div>
    {selected && <div className="admin-sample-modal" role="dialog" aria-modal="true" aria-label={`${config.title} detail`}><div><button className="admin-sample-modal-close" onClick={() => setSelected(null)} aria-label="Close detail"><X size={18} /></button><p className="admin-kicker"><span /> Sample detail</p><h2>{selected.name || selected.title || selected.id}</h2><dl>{Object.entries(selected).map(([key, value]) => <React.Fragment key={key}><dt>{formatValue(key)}</dt><dd>{formatValue(value)}</dd></React.Fragment>)}</dl><div className="admin-sample-modal-actions"><button onClick={() => setSelected(null)}>Back</button>{type === 'applications' && <><button onClick={() => mutate(selected.id, { status: 'Approved' }, 'Sample application approved locally.')}>Approve</button><button onClick={() => mutate(selected.id, { status: 'Rejected' }, 'Sample application rejected locally.')}>Reject</button><button onClick={() => mutate(selected.id, { status: 'Clarification Required' }, 'Sample clarification requested locally.')}>Request clarification</button></>}{type === 'payments' && selected.status === 'Pending Verification' && <button onClick={() => mutate(selected.id, { status: 'Paid' }, 'Sample payment verified locally.')}>Verify payment</button>}{type === 'reports' && <button onClick={sampleExport}>Sample export</button>}</div></div></div>}
  </div></AdminLayout>
}
