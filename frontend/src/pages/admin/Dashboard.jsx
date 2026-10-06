import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarDays, CircleDollarSign, FileText, Users } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/context/AuthContext'
import { hasModulePermission } from '@/config/adminAccess'
import { dashboardData } from '@/data/dashboard'

const shortDate = (date) => new Intl.DateTimeFormat('en-SG', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date))

export default function AdminDashboard() {
  const { user } = useAuth()
  const { stats, recentActivity, upcomingEvents } = dashboardData
  const canViewApplications = hasModulePermission(user, 'Applications')
  const canViewMembers = hasModulePermission(user, 'Members')
  const canViewPayments = hasModulePermission(user, 'Payments')
  const canViewEvents = hasModulePermission(user, 'Events')
  const canViewAudit = hasModulePermission(user, 'Audit Logs')
  const overviewMetrics = [
    ...(canViewMembers ? [{ label: 'Active memberships', value: stats.activeMembers, detail: `${stats.totalMembers} total memberships`, icon: Users, tone: 'teal' }] : []),
    ...(canViewApplications ? [{ label: 'Pending applications', value: stats.pendingApplications, detail: 'Awaiting review', icon: FileText, tone: 'coral' }] : []),
    ...(canViewEvents ? [{ label: 'Upcoming events', value: String(upcomingEvents.length).padStart(2, '0'), detail: 'Scheduled in the calendar', icon: CalendarDays, tone: 'cyan' }] : []),
    ...(canViewPayments ? [{ label: 'Outstanding payments', value: `SGD ${stats.outstandingPayments.toLocaleString('en-SG')}`, detail: 'Open payment activity', icon: CircleDollarSign, tone: 'plum' }] : []),
  ]
  const canViewMembershipOverview = canViewApplications || canViewMembers

  return (
    <AdminLayout>
      <div className="admin-dashboard">
        <section className="admin-dashboard-intro">
          <div>
            <p className="admin-kicker"><span /> Admin portal</p>
            <h1>WISTA Singapore<br /><em>at a glance.</em></h1>
            <p className="admin-intro-copy">Review the operational areas available to your assigned role.</p>
          </div>
          <p className="admin-update-note">Operational overview<br /><strong>Current workspace</strong></p>
        </section>

        {!!overviewMetrics.length && <section className="admin-overview" aria-labelledby="overview-heading">
          <div className="admin-section-heading"><p id="overview-heading">Operational overview</p><span>Current workspace</span></div>
          <div className="admin-metric-grid">{overviewMetrics.map(({ label, value, detail, icon: Icon, tone }) => <div key={label} className={`admin-metric admin-metric-${tone}`}><Icon size={17} aria-hidden="true" /><p>{label}</p><strong>{value}</strong><span>{detail}</span></div>)}</div>
        </section>}

        {canViewMembershipOverview && <section className="admin-membership-block" aria-labelledby="membership-heading">
          <div className="admin-section-heading"><p id="membership-heading">Membership overview</p><span>Current membership base</span></div>
          <div className="admin-membership-data">
            {canViewMembers && <><div><span>Active</span><strong>{stats.activeMembers}</strong></div><div><span>Expiring soon</span><strong>{stats.expiringMemberships}</strong></div></>}
            {canViewApplications && <div><span>Pending applications</span><strong>{stats.pendingApplications}</strong></div>}
          </div>
          <div className="admin-inline-links">
            {canViewMembers && <Link to="/admin/members">View memberships <ArrowUpRight size={15} /></Link>}
            {canViewApplications && <Link to="/admin/applications">Review applications <ArrowUpRight size={15} /></Link>}
          </div>
        </section>}

        {(canViewApplications || canViewPayments) && <div className="admin-dashboard-columns">
          {canViewApplications && <section className="admin-dashboard-panel admin-applications-panel" aria-labelledby="applications-heading">
            <div className="admin-panel-title"><div><p id="applications-heading">Applications</p><span>Current review queue</span></div><Link to="/admin/applications">View all <ArrowUpRight size={15} /></Link></div>
            <div className="admin-queue-summary"><strong>{stats.pendingApplications}</strong><div><span>Applications pending review</span><p>Prioritise the application queue and continue EXCO review.</p></div></div>
            <Link to="/admin/applications" className="admin-text-action">Review applications <ArrowUpRight size={15} /></Link>
          </section>}
          {canViewPayments && <section className="admin-dashboard-panel admin-payment-panel" aria-labelledby="payments-heading">
            <div className="admin-panel-title"><div><p id="payments-heading">Payment activity</p><span>Finance overview</span></div><Link to="/admin/payments">Payments <ArrowUpRight size={15} /></Link></div>
            <div className="admin-payment-total"><span>Outstanding payment activity</span><strong>SGD {stats.outstandingPayments.toLocaleString('en-SG')}</strong></div>
            <p className="admin-panel-copy">Use the Payments module to review recorded transactions and invoice activity.</p>
          </section>}
        </div>}

        {(canViewEvents || canViewAudit) && <div className="admin-dashboard-columns admin-dashboard-lower">
          {canViewEvents && <section className="admin-dashboard-panel admin-events-panel" aria-labelledby="events-heading">
            <div className="admin-panel-title"><div><p id="events-heading">Upcoming events</p><span>Programme calendar</span></div><Link to="/admin/events">View events <ArrowUpRight size={15} /></Link></div>
            <div className="admin-event-list">{upcomingEvents.map((event) => <div key={event.id} className="admin-event-row"><time dateTime={event.date}><span>{new Date(event.date).toLocaleDateString('en-SG', { month: 'short' })}</span>{new Date(event.date).getDate()}</time><div><strong>{event.title}</strong><span>{shortDate(event.date)}</span></div><CalendarDays size={18} aria-hidden="true" /></div>)}</div>
          </section>}
          {canViewAudit && <section className="admin-dashboard-panel admin-activity-panel" aria-labelledby="activity-heading">
            <div className="admin-panel-title"><div><p id="activity-heading">Recent activity</p><span>From the current dashboard feed</span></div><Link to="/admin/audit-logs">Audit logs <ArrowUpRight size={15} /></Link></div>
            <div className="admin-activity-list">{recentActivity.map((activity) => <div key={activity.id} className="admin-activity-row"><i aria-hidden="true" /><div><strong>{activity.action}</strong><span>{activity.user}{activity.event ? ` · ${activity.event}` : ''}</span></div><time>{activity.time}</time></div>)}</div>
          </section>}
        </div>}

        {(canViewApplications || canViewMembers || canViewEvents || canViewPayments) && <section className="admin-quick-actions" aria-labelledby="quick-actions-heading">
          <div className="admin-section-heading"><p id="quick-actions-heading">Quick actions</p><span>Available to your role</span></div>
          <div>
            {canViewApplications && <Link to="/admin/applications">Review applications <ArrowUpRight size={15} /></Link>}
            {canViewMembers && <Link to="/admin/members">Manage memberships <ArrowUpRight size={15} /></Link>}
            {canViewEvents && <Link to="/admin/events">Manage events <ArrowUpRight size={15} /></Link>}
            {canViewPayments && <Link to="/admin/payments">Review payments <ArrowUpRight size={15} /></Link>}
          </div>
        </section>}
      </div>
    </AdminLayout>
  )
}
