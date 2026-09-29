import React, { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { User, UserPlus, Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'ABOUT', href: '/about' },
  { label: 'MEMBERSHIP', href: '/membership' },
  { label: 'EVENTS', href: '/events' },
  { label: 'NEWS', href: '/news' },
  { label: 'COMMITTEES', href: '/committees' },
  { label: 'NETWORK', href: '/network' },
  { label: 'CONTACT', href: '/contact' },
]

export default function Header({ cinematic = false, lightBg = false }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()

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

  const isHomePage = cinematic || location.pathname === '/'

  return (
    <header 
      className={`floating-header relative ${cinematic ? 'cinematic-header' : ''} ${scrolled ? 'scrolled-header' : ''} ${lightBg && !scrolled ? 'light-header' : ''}`}
    >
      {/* LEFT: OFFICIAL WISTA SINGAPORE LOGO */}
      <div className="header-left flex items-center">
        <Link to="/" className="brand relative block w-[95px] sm:w-[110px] md:w-[125px] h-[36px] sm:h-[40px] flex items-center">
          <img 
            src="/wista-logo-singapore-white.svg" 
            alt="WISTA Singapore" 
            className="w-full h-auto block drop-shadow"
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

      {/* RIGHT: LOGIN & REGISTER ACTIONS (ALWAYS VISIBLE) + HAMBURGER BUTTON (< 1180px) */}
      <div className="header-right flex items-center gap-1.5 sm:gap-2.5">
        {/* LOGIN CTA */}
        <Link 
          to="/login" 
          className="auth-nav-link login-link whitespace-nowrap inline-flex items-center gap-1 px-2 py-1 text-[9px] sm:text-[10px] sm:px-3 sm:py-1.5"
        >
          <User size={12} className="hidden sm:inline" />
          <span>LOGIN</span>
        </Link>

        {/* REGISTER CTA - DIRECT NAVIGATION TO /register */}
        <Link 
          to="/register" 
          className="auth-nav-link register-btn whitespace-nowrap inline-flex items-center gap-1 px-2 py-1 text-[9px] sm:text-[10px] sm:px-3 sm:py-1.5"
        >
          <UserPlus size={12} className="hidden sm:inline" />
          <span>REGISTER</span>
        </Link>

        {/* MOBILE MENU TRIGGER BUTTON (ONLY VISIBLE ON NARROW SCREENS < 1180px) */}
        <button 
          className="mobile-nav-toggle p-1.5 text-current focus:outline-none flex items-center justify-center rounded"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          aria-label="Toggle mobile menu"
        >
          {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* LIGHTWEIGHT INLINE RESPONSIVE MOBILE NAVIGATION PANEL (< 1180px) */}
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
          </nav>
        </div>
      )}
    </header>
  )
}
