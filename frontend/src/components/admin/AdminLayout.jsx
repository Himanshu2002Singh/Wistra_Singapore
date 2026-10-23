import React, { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarDays, ChevronDown, FileText, LayoutDashboard, LogOut, Menu, Newspaper, ShieldCheck, Users, WalletCards, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { hasModulePermission } from '@/config/adminAccess'
import { getAdminApplicationsApi } from '@/services/membershipService'
import { getAdminMembershipsApi } from '@/services/memberService'
import { getAdminPaymentsApi } from '@/services/paymentService'
import { getAdminEventsApi, getAdminNewsApi } from '@/services/adminContentService'
import { getAdminUsersApi } from '@/services/adminUserAccessService'

const navigation = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/applications', label: 'Applications', module: 'Applications', icon: FileText, notificationKey: 'applications' },
  { to: '/admin/members', label: 'Memberships', module: 'Members', icon: Users, notificationKey: 'memberships' },
  { to: '/admin/payments', label: 'Payments', module: 'Payments', icon: WalletCards, notificationKey: 'payments' },
  { to: '/admin/events', label: 'Events', module: 'Events', icon: CalendarDays, notificationKey: 'events' },
  { to: '/admin/news', label: 'News', module: 'News', icon: Newspaper, notificationKey: 'news' },
  { to: '/admin/users', label: 'Team and Roles', module: 'Users & Roles', icon: ShieldCheck, notificationKey: 'team' },
  { to: '/admin/audit-logs', label: 'Audit Logs', module: 'Audit Logs', icon: ShieldCheck },
]

const pageNames = {
  '/admin': 'Dashboard', '/admin/dashboard': 'Dashboard', '/admin/applications': 'Applications',
  '/admin/members': 'Memberships', '/admin/payments': 'Payments', '/admin/events': 'Events',
  '/admin/news': 'News', '/admin/communications': 'News', '/admin/users': 'Team and Roles', '/admin/audit-logs': 'Audit Logs',
}

export default function AdminLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifications, setNotifications] = useState({})
  const { user, logout, isDemo } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const displayName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Administrator'
  const initials = user?.first_name ? `${user.first_name[0]}${user.last_name?.[0] || ''}`.toUpperCase() : 'AD'
  const role = user?.role?.name || user?.role || 'ADMINISTRATOR'

  const handleLogout = async () => { await logout(); navigate('/admin', { replace: true }) }
  const closeMobileMenu = () => setMobileMenuOpen(false)
  const visibleNavigation = navigation.filter(({ module }) => !module || hasModulePermission(user, module))

  const loadSidebarNotifications = useCallback(async () => {
    if (isDemo) {
      setNotifications({})
      return
    }

    const jobs = []
    const canView = (module) => hasModulePermission(user, module)
    if (canView('Applications')) jobs.push(['applications', getAdminApplicationsApi({ status: 'PENDING', page: 1, limit: 1 }).then((result) => Number(result?.data?.total) || 0)])
    if (canView('Members')) jobs.push(['memberships', getAdminMembershipsApi({ status: 'PENDING', page: 1, limit: 1 }).then((result) => Number(result?.data?.total) || 0)])
    if (canView('Payments')) jobs.push(['payments', Promise.all([
      getAdminPaymentsApi({ status: 'SUBMITTED', page: 1, limit: 1 }),
      getAdminPaymentsApi({ status: 'UNDER_VERIFICATION', page: 1, limit: 1 }),
    ]).then((results) => results.reduce((sum, result) => sum + (Number(result?.data?.total) || 0), 0))])
    if (canView('Events')) jobs.push(['events', getAdminEventsApi().then((result) => (result?.data || []).filter((event) => event.status === 'DRAFT').length)])
    if (canView('News')) jobs.push(['news', getAdminNewsApi().then((result) => (result?.data || []).filter((article) => article.status === 'DRAFT').length)])
    if (canView('Users & Roles')) jobs.push(['team', getAdminUsersApi({ status: 'INACTIVE', page: 1, limit: 1 }).then((result) => Number(result?.data?.total) || 0)])
    const results = await Promise.allSettled(jobs.map(([, request]) => request))
    setNotifications((current) => {
      const next = { ...current }
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') next[jobs[index][0]] = result.value
      })
      return next
    })
  }, [isDemo, user])

  useEffect(() => {
    loadSidebarNotifications()
    const interval = window.setInterval(loadSidebarNotifications, 60_000)
    window.addEventListener('focus', loadSidebarNotifications)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', loadSidebarNotifications)
    }
  }, [loadSidebarNotifications])

  return (
    <div className="wista-admin-shell">
      <header className="admin-global-header">
        <div className="admin-header-brand">
          <Link to="/" aria-label="Go to WISTA Singapore public website" className="admin-logo-link"><img src="/wista-logo-singapore-white.svg" alt="WISTA Singapore" /></Link>
          <span className="admin-header-rule" />
          <div className="admin-header-context"><span>Admin Portal</span><span className="admin-context-divider">/</span><strong>{pageNames[location.pathname] || 'Dashboard'}</strong></div>
        </div>
        <div className="admin-header-actions">
          <div className="admin-role-status"><i /> {role.replaceAll('_', ' ')}</div>
          <div className="admin-user-menu">
            <button type="button" className="admin-user-trigger" onClick={() => setProfileOpen((isOpen) => !isOpen)} aria-expanded={profileOpen} aria-label="Open administrator menu">
              <span className="admin-avatar">{initials}</span><span className="admin-user-name">{displayName}</span><ChevronDown size={15} aria-hidden="true" />
            </button>
            {profileOpen && <div className="admin-profile-popover"><p>{displayName}</p><span>{role.replaceAll('_', ' ')}</span><button type="button" onClick={handleLogout}><LogOut size={14} /> Sign out</button></div>}
          </div>
          <button type="button" className="admin-mobile-toggle" onClick={() => setMobileMenuOpen((isOpen) => !isOpen)} aria-expanded={mobileMenuOpen} aria-label="Toggle admin navigation">{mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
      </header>

      <div className="admin-shell-body">
        <aside className={`admin-sidebar ${mobileMenuOpen ? 'is-open' : ''}`} aria-label="Admin navigation">
          <nav className="admin-navigation">
            <p className="admin-nav-label">Operations</p>
            {visibleNavigation.map(({ to, label, icon: Icon, notificationKey }) => {
              const count = notificationKey ? notifications[notificationKey] || 0 : 0
              const hasNotifications = count > 0
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={closeMobileMenu}
                  aria-label={hasNotifications ? `${label}, ${count} notifications` : undefined}
                  className={({ isActive }) => `admin-nav-link${isActive ? ' is-active' : ''}`}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{label}</span>
                  {hasNotifications && <span className="admin-nav-badge" aria-hidden="true">{count > 99 ? '99+' : count}</span>}
                </NavLink>
              )
            })}
          </nav>
          <div className="admin-sidebar-bottom">
            <Link to="/" className="admin-nav-link"><ArrowLeft size={17} aria-hidden="true" /><span>Public Website</span></Link>
            <button type="button" className="admin-nav-link admin-signout" onClick={handleLogout}><LogOut size={17} aria-hidden="true" /><span>Sign Out</span></button>
          </div>
        </aside>
        {mobileMenuOpen && <button className="admin-nav-scrim" aria-label="Close admin navigation" onClick={closeMobileMenu} />}
        <main className="admin-main-content">
          {isDemo && <div className="border-b border-amber-300 bg-amber-50 px-5 py-3 text-sm text-amber-950" role="status"><strong>Frontend demo session.</strong> Live records and admin actions require the backend; backend RBAC has not authenticated this session.</div>}
          {children || <Outlet />}
        </main>
      </div>
    </div>
  )
}
