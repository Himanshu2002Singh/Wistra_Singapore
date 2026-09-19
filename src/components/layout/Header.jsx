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
      <div className="header-left">
        <Link to="/" className="brand relative block w-[125px] h-[40px] flex items-center">
          {isHomePage ? (
            /* HOMEPAGE ONLY: RESTORED PREVIOUS WHITE LOGO TREATMENT OVER CINEMATIC HERO */
            <img 
              src="/wista-logo-singapore-white.svg" 
              alt="WISTA Singapore" 
              className="w-[125px] h-auto block"
            />
          ) : (
            /* OTHER PAGES: BLUE LOGO AT TOP -> WHITE LOGO WHEN SCROLLED */
            <>
              {/* Blue Singapore Logo - Top of page state for inner pages */}
              <img 
                src="/wista-logo-singapore-blue.svg" 
                alt="WISTA Singapore" 
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-[125px] h-auto transition-opacity duration-300 ease-in-out ${
                  scrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              />
              {/* White Singapore Logo - Scrolled state for inner pages */}
              <img 
                src="/wista-logo-singapore-white.svg" 
                alt="WISTA Singapore" 
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-[125px] h-auto transition-opacity duration-300 ease-in-out ${
                  scrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              />
            </>
          )}
        </Link>
      </div>

      {/* CENTER: DIRECT DESKTOP NAVIGATION (NO MENU/SEARCH/HAMBURGER ON DESKTOP) */}
      <nav className="header-center hidden lg:flex items-center gap-7">
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

      {/* RIGHT: LOGIN & REGISTER ACTIONS (NO DESKTOP MENU BUTTON AFTER REGISTER) */}
      <div className="header-right flex items-center gap-3 sm:gap-5">
        {/* LOGIN CTA */}
        <Link to="/login" className="auth-nav-link login-link hidden sm:inline-flex items-center gap-1.5">
          <User size={14} />
          <span>LOGIN</span>
        </Link>

        {/* REGISTER CTA - DIRECT NAVIGATION TO /register */}
        <Link to="/register" className="auth-nav-link register-btn hidden sm:inline-flex items-center gap-1.5">
          <UserPlus size={14} />
          <span>REGISTER</span>
        </Link>

        {/* MOBILE MENU TRIGGER BUTTON (ONLY VISIBLE ON MOBILE < 1024px) */}
        <button 
          className="mobile-nav-toggle lg:hidden p-2 text-current focus:outline-none flex items-center justify-center rounded"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          aria-label="Toggle mobile menu"
        >
          {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* LIGHTWEIGHT INLINE RESPONSIVE MOBILE NAVIGATION PANEL (< 1024px) */}
      {mobileNavOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-[#0b1f33] text-white border-t border-white/10 shadow-2xl p-6 flex flex-col gap-4 animate-fade-in z-50">
          <nav className="flex flex-col gap-2">
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
          <div className="flex flex-col gap-2 pt-2">
            <Link 
              to="/login" 
              onClick={() => setMobileNavOpen(false)}
              className="w-full text-center py-2.5 border border-white/30 text-white font-bold tracking-widest text-xs uppercase rounded hover:bg-white/10 transition flex items-center justify-center gap-2"
            >
              <User size={14} />
              <span>LOGIN</span>
            </Link>
            <Link 
              to="/register" 
              onClick={() => setMobileNavOpen(false)}
              className="w-full text-center py-2.5 bg-[var(--coral)] text-white font-bold tracking-widest text-xs uppercase rounded hover:bg-[#f27663] transition flex items-center justify-center gap-2"
            >
              <UserPlus size={14} />
              <span>REGISTER</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
