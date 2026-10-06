import React, { useState, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { User, UserPlus, Menu, X, LogOut, LayoutDashboard, ArrowUpRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import TopBar from './TopBar'

const navLinks = [
  { label: 'ABOUT', href: '/about' },
  { label: 'MEMBERSHIP', href: '/membership' },
  { label: 'EVENTS', href: '/events' },
  { label: 'NEWS', href: '/news' },
  { label: 'COMMITTEES', href: '/committees' },
  { label: 'CONTACT', href: '/contact' },
]

export default function Header({ cinematic = false, lightBg = false, whiteLogo = false }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const { isAuthenticated, user, logout } = useAuth()
  const showTopBar = !location.pathname.startsWith('/admin')

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const roleName = user?.role?.name || user?.role || 'MEMBER'
  const isAdmin = [
    'SUPER_ADMIN',
    'MEMBERSHIP_ADMIN',
    'FINANCE_ADMIN',
    'EVENTS_ADMIN',
    'COMMUNICATIONS_ADMIN',
  ].includes(roleName)

  const dashboardTarget = isAdmin ? '/admin/dashboard' : '/member/dashboard'

  return (
    <>
    {showTopBar && <TopBar />}
    <header
      className={`floating-header relative ${cinematic ? 'cinematic-header' : ''} ${!showTopBar ? 'without-topbar' : ''} ${scrolled ? 'scrolled-header' : ''} ${lightBg && !scrolled ? 'light-header' : ''}`}
    >
      {/* LEFT: OFFICIAL WISTA SINGAPORE LOGO */}
      <div className="header-left flex items-center">
        <Link to="/" className="brand relative flex items-center">
          <img 
            src={whiteLogo ? '/wista-logo-singapore-white.svg' : '/wista-logo.svg'}
            alt="WISTA Singapore" 
            className="h-14 sm:h-[58px] md:h-[62px] w-auto block drop-shadow object-contain"
          />
        </Link>
      </div>

      {/* CENTER: DESKTOP NAVIGATION (ONLY VISIBLE ON DESKTOP >= 1180px) */}
      <nav className="header-center items-center gap-5 xl:gap-7">
        {navLinks.map((link) => (
          <NavLink
            key={link.href}
            to={link.href}
            className={({ isActive }) => 
              `nav-item-link ${isActive ? 'active' : ''}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* RIGHT: LOGIN & REGISTER / AUTHENTICATED ACTIONS */}
      <div className="header-right flex items-center gap-1.5 sm:gap-2.5">
        {isAuthenticated ? (
          <>
            <Link
              to={dashboardTarget}
              className="auth-nav-link login-link whitespace-nowrap inline-flex items-center gap-1 px-2 py-1 text-[9px] sm:text-[10px] sm:px-3 sm:py-1.5"
            >
              <LayoutDashboard size={12} className="hidden sm:inline" />
              <span>{isAdmin ? 'ADMIN' : 'DASHBOARD'}</span>
            </Link>

            <button
              onClick={handleLogout}
              className="auth-nav-link register-btn whitespace-nowrap inline-flex items-center gap-1 px-2 py-1 text-[9px] sm:text-[10px] sm:px-3 sm:py-1.5 cursor-pointer"
            >
              <LogOut size={12} className="hidden sm:inline" />
              <span>LOGOUT</span>
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="auth-nav-link login-link whitespace-nowrap inline-flex items-center gap-1 px-2 py-1 text-[9px] sm:text-[10px] sm:px-3 sm:py-1.5"
            >
              <User size={12} className="hidden sm:inline" />
              <span>LOGIN</span>
            </Link>

            <Link
              to="/register"
              className="auth-nav-link register-btn whitespace-nowrap inline-flex items-center gap-1 px-2 py-1 text-[9px] sm:text-[10px] sm:px-3 sm:py-1.5"
            >
              {cinematic ? <ArrowUpRight size={13} className="inline" /> : <UserPlus size={12} className="hidden sm:inline" />}
              <span>REGISTER</span>
            </Link>
          </>
        )}

        {/* MOBILE MENU TRIGGER BUTTON */}
        <button 
          className="mobile-nav-toggle p-1.5 text-current focus:outline-none flex items-center justify-center rounded"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          aria-label="Toggle mobile menu"
        >
          {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* LIGHTWEIGHT INLINE RESPONSIVE MOBILE NAVIGATION PANEL */}
      {mobileNavOpen && (
        <div className="mobile-dropdown-panel absolute top-full left-0 right-0 bg-[#0b1f33] text-white border-t border-white/10 shadow-2xl p-5 sm:p-6 flex flex-col gap-3 animate-fade-in z-50">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) => 
                  `text-xs font-bold tracking-[0.14em] py-2.5 border-b border-white/10 transition-colors ${
                    isActive ? 'text-[var(--teal)]' : 'text-slate-200 hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <>
                <Link
                  to={dashboardTarget}
                  onClick={() => setMobileNavOpen(false)}
                  className="text-xs font-bold tracking-[0.14em] py-2.5 border-b border-white/10 text-[var(--teal)] hover:text-white flex items-center gap-2"
                >
                  <LayoutDashboard size={14} />
                  <span>{isAdmin ? 'ADMIN DASHBOARD' : 'MEMBER DASHBOARD'}</span>
                </Link>
                <button
                  onClick={() => { setMobileNavOpen(false); handleLogout(); }}
                  className="text-xs font-bold tracking-[0.14em] py-2.5 text-red-400 hover:text-red-300 flex items-center gap-2 text-left"
                >
                  <LogOut size={14} />
                  <span>LOGOUT ({user?.email})</span>
                </button>
              </>
            ) : null}
          </nav>
        </div>
      )}
    </header>
    </>
  )
}
