import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarDays, FileText, Users } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/context/AuthContext'
import { hasModulePermission } from '@/config/adminAccess'
import { getAdminDashboardSummaryApi } from '@/services/adminDashboardService'

const formatDate = (value) => value ? new Intl.DateTimeFormat('en-SG', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : '—'
const formatTime = (value) => value ? new Intl.DateTimeFormat('en-SG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
const displayCount = (value) => value === null ? '—' : value

export default function AdminDashboard() {
  const { user } = useAuth()
  const canViewApplications = hasModulePermission(user, 'Applications')
  const canViewMembers = hasModulePermission(user, 'Members')
  const canViewEvents = hasModulePermission(user, 'Events')
  const canViewAudit = hasModulePermission(user, 'Audit Logs')
  const [summary, setSummary] = useState({ memberships: null, applications: null, events: null, audit: null, errors: {} })
  const [loading, setLoading] = useState(true)

  const loadSummary = useCallback(async () => {
    return getAdminDashboardSummaryApi({
      members: canViewMembers,
      applications: canViewApplications,
      events: canViewEvents,
      audit: canViewAudit,
    })
  }, [canViewApplications, canViewAudit, canViewEvents, canViewMembers])

  useEffect(() => {
    let active = true
    loadSummary().then((data) => { if (active) setSummary(data) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [loadSummary])

  const refreshSummary = async () => {
    setLoading(true)
    try { setSummary(await loadSummary()) } finally { setLoading(false) }
  }

  const now = summary.asOf || Number.MAX_SAFE_INTEGER
  const upcomingEvents = (summary.events || [])
    .filter((event) => event.status === 'PUBLISHED' && new Date(event.starts_at).getTime() >= now)
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
    .slice(0, 4)
  const metrics = [
    ...(canViewMembers ? [{ label: 'Active memberships', value: displayCount(summary.memberships), detail: summary.errors.memberships ? 'Membership API unavailable' : 'Live database total', icon: Users, tone: 'teal' }] : []),
    ...(canViewApplications ? [{ label: 'Pending applications', value: displayCount(summary.applications), detail: summary.errors.applications ? 'Applications API unavailable' : 'Live review queue', icon: FileText, tone: 'coral' }] : []),
    ...(canViewEvents ? [{ label: 'Upcoming published events', value: summary.events === null ? '—' : String(upcomingEvents.length).padStart(2, '0'), detail: summary.errors.events ? 'Events API unavailable' : 'Live event catalogue', icon: CalendarDays, tone: 'cyan' }] : []),
  ]
  const canViewMembershipOverview = canViewApplications || canViewMembers

  return <AdminLayout><div className="admin-dashboard">
    <section className="admin-dashboard-intro"><div><p className="admin-kicker"><span /> Admin portal</p><h1>WISTA Singapore<br /><em>at a glance.</em></h1><p className="admin-intro-copy">Review operational information available to your assigned role.</p></div><p className="admin-update-note">Operational overview<br /><strong>Live backend data</strong></p></section>

    {!!metrics.length && <section className="admin-overview" aria-labelledby="overview-heading"><div className="admin-section-heading"><p id="overview-heading">Operational overview</p><span>{loading ? 'Loading…' : 'Connected records'}</span></div><div className="admin-metric-grid">{metrics.map(({ label, value, detail, icon: Icon, tone }) => <div key={label} className={`admin-metric admin-metric-${tone}`}><Icon size={17} aria-hidden="true" /><p>{label}</p><strong>{value}</strong><span>{detail}</span></div>)}</div></section>}

    {canViewMembershipOverview && <section className="admin-membership-block" aria-labelledby="membership-heading"><div className="admin-section-heading"><p id="membership-heading">Membership overview</p><span>Database-backed summary</span></div><div className="admin-membership-data">{canViewMembers && <div><span>Active memberships</span><strong>{displayCount(summary.memberships)}</strong></div>}{canViewApplications && <div><span>Pending applications</span><strong>{displayCount(summary.applications)}</strong></div>}</div><div className="admin-inline-links">{canViewMembers && <Link to="/admin/members">View memberships <ArrowUpRight size={15} /></Link>}{canViewApplications && <Link to="/admin/applications">Review applications <ArrowUpRight size={15} /></Link>}</div></section>}

    {(canViewApplications || canViewEvents) && <div className="admin-dashboard-columns">
      {canViewApplications && <section className="admin-dashboard-panel admin-applications-panel" aria-labelledby="applications-heading"><div className="admin-panel-title"><div><p id="applications-heading">Applications</p><span>Current review queue</span></div><Link to="/admin/applications">View all <ArrowUpRight size={15} /></Link></div><div className="admin-queue-summary"><strong>{displayCount(summary.applications)}</strong><div><span>Applications pending review</span><p>{summary.errors.applications ? 'Application data could not be loaded.' : 'Count comes from the authenticated applications API.'}</p></div></div><Link to="/admin/applications" className="admin-text-action">Review applications <ArrowUpRight size={15} /></Link></section>}
      {canViewEvents && <section className="admin-dashboard-panel admin-events-panel" aria-labelledby="events-heading"><div className="admin-panel-title"><div><p id="events-heading">Upcoming events</p><span>Published event records</span></div><Link to="/admin/events">View events <ArrowUpRight size={15} /></Link></div>{summary.errors.events ? <p className="admin-panel-copy">Event data could not be loaded. Check the Events API and database migration.</p> : upcomingEvents.length ? <div className="admin-event-list">{upcomingEvents.map((event) => <div key={event.id} className="admin-event-row"><time dateTime={event.starts_at}><span>{new Date(event.starts_at).toLocaleDateString('en-SG', { month: 'short' })}</span>{new Date(event.starts_at).getDate()}</time><div><strong>{event.title}</strong><span>{formatDate(event.starts_at)}</span></div><CalendarDays size={18} aria-hidden="true" /></div>)}</div> : <p className="admin-panel-copy">{summary.events === null ? 'Event data is not available.' : 'There are no upcoming published events.'}</p>}</section>}
    </div>}

    {canViewAudit && <section className="admin-dashboard-panel admin-activity-panel" aria-labelledby="activity-heading"><div className="admin-panel-title"><div><p id="activity-heading">Recent activity</p><span>Protected audit log records</span></div><Link to="/admin/audit-logs">Audit logs <ArrowUpRight size={15} /></Link></div>{summary.errors.audit ? <p className="admin-panel-copy">Audit data could not be loaded.</p> : summary.audit?.length ? <div className="admin-activity-list">{summary.audit.map((activity) => <div key={activity.id} className="admin-activity-row"><i aria-hidden="true" /><div><strong>{activity.action}</strong><span>{[activity.user?.first_name, activity.user?.last_name].filter(Boolean).join(' ') || 'System'}{activity.module ? ` · ${activity.module}` : ''}</span></div><time>{formatTime(activity.created_at)}</time></div>)}</div> : <p className="admin-panel-copy">{summary.audit === null ? 'Audit data is not available.' : 'No audit activity has been recorded yet.'}</p>}</section>}

    {(canViewApplications || canViewMembers || canViewEvents || hasModulePermission(user, 'Payments')) && <section className="admin-quick-actions" aria-labelledby="quick-actions-heading"><div className="admin-section-heading"><p id="quick-actions-heading">Quick actions</p><span>Available to your role</span></div><div>{canViewApplications && <Link to="/admin/applications">Review applications <ArrowUpRight size={15} /></Link>}{canViewMembers && <Link to="/admin/members">Manage memberships <ArrowUpRight size={15} /></Link>}{canViewEvents && <Link to="/admin/events">Manage events <ArrowUpRight size={15} /></Link>}{hasModulePermission(user, 'Payments') && <Link to="/admin/payments">Open Payments <ArrowUpRight size={15} /></Link>}</div></section>}

    <div className="admin-dashboard-refresh"><button type="button" onClick={refreshSummary} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh overview'}</button></div>
  </div></AdminLayout>
}
