import React, { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, BarChart3, Bell, CalendarDays, ChevronDown, FileText, LayoutDashboard, LogOut, Menu, MessageSquare, ShieldCheck, Users, WalletCards, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const navigation = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/applications', label: 'Applications', icon: FileText },
  { to: '/admin/members', label: 'Members', icon: Users },
  { to: '/admin/payments', label: 'Payments', icon: WalletCards },
  { to: '/admin/events', label: 'Events', icon: CalendarDays },
  { to: '/admin/communications', label: 'Communications', icon: MessageSquare },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/users', label: 'Users & Roles', icon: ShieldCheck },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldCheck },
]

const pageNames = {
  '/admin': 'Dashboard', '/admin/dashboard': 'Dashboard', '/admin/applications': 'Applications',
  '/admin/members': 'Members', '/admin/payments': 'Payments', '/admin/events': 'Events',
  '/admin/communications': 'Communications', '/admin/reports': 'Reports', '/admin/users': 'Users & Roles', '/admin/audit-logs': 'Audit Logs',
}

export default function AdminLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const displayName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Administrator'
  const initials = user?.first_name ? `${user.first_name[0]}${user.last_name?.[0] || ''}`.toUpperCase() : 'AD'
  const role = user?.role?.name || user?.role || 'ADMINISTRATOR'

  const handleLogout = async () => { await logout(); navigate('/login') }
  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="wista-admin-shell">
      <header className="admin-global-header">
        <div className="admin-header-brand">
          <Link to="/" aria-label="Go to WISTA Singapore public website" className="admin-logo-link"><img src="/wista-logo-singapore-white.svg" alt="WISTA Singapore" /></Link>
          <span className="admin-header-rule" />
          <div className="admin-header-context"><span>Admin Portal</span><span className="admin-context-divider">/</span><strong>{pageNames[location.pathname] || 'Dashboard'}</strong></div>
        </div>
        <div className="admin-header-actions">
          <div className="admin-notification-wrap"><button className="admin-notification" type="button" onClick={() => setNotificationOpen((isOpen) => !isOpen)} aria-expanded={notificationOpen} aria-label="Show sample notifications"><Bell size={18} aria-hidden="true" /><span aria-hidden="true" /></button>{notificationOpen && <div className="admin-notification-popover"><strong>Sample notifications</strong><p>15 applications are awaiting review.</p><p>Payment activity is available in the sample Payments area.</p></div>}</div>
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
            {navigation.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={closeMobileMenu} className={({ isActive }) => `admin-nav-link${isActive ? ' is-active' : ''}`}><Icon size={18} aria-hidden="true" /><span>{label}</span></NavLink>)}
          </nav>
          <div className="admin-sidebar-bottom">
            <Link to="/" className="admin-nav-link"><ArrowLeft size={17} aria-hidden="true" /><span>Public Website</span></Link>
            <button type="button" className="admin-nav-link admin-signout" onClick={handleLogout}><LogOut size={17} aria-hidden="true" /><span>Sign Out</span></button>
          </div>
        </aside>
        {mobileMenuOpen && <button className="admin-nav-scrim" aria-label="Close admin navigation" onClick={closeMobileMenu} />}
        <main className="admin-main-content">{children || <Outlet />}</main>
      </div>
    </div>
  )
}
