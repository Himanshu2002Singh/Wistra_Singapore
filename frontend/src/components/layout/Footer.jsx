import React from 'react'
import { Link } from 'react-router-dom'

const navItems = [
  { label: 'ABOUT', href: '/about' },
  { label: 'NETWORK', href: '/network' },
  { label: 'EVENTS', href: '/events' },
  { label: 'NEWS', href: '/news' },
  { label: 'MEMBERSHIP', href: '/membership' },
  { label: 'COMMITTEES', href: '/committees' },
]

export default function Footer() {
  return (
    <footer className="editorial-footer">
      <div>
        <img src="/wista-logo-singapore-white.svg" alt="WISTA Singapore" />
        <p>Women moving<br />maritime forward.</p>
      </div>
      <div className="footer-links">
        {navItems.map((item) => (
          <Link key={item.href} to={item.href}>{item.label}</Link>
        ))}
      </div>
      <div className="footer-meta">
        © WISTA Singapore 2026<br />
        <a href="https://www.linkedin.com" target="_blank" rel="noreferrer">LinkedIn ↗</a>
      </div>
    </footer>
  )
}
