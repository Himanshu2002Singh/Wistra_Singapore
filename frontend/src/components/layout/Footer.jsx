import React from 'react'
import { Link } from 'react-router-dom'
import socialLinks from '@/config/socialLinks'

const navItems = [
  { label: 'ABOUT', href: '/about' },
  { label: 'MEMBERSHIP', href: '/membership' },
  { label: 'EVENTS', href: '/events' },
  { label: 'NEWS', href: '/news' },
  { label: 'COMMITTEES', href: '/committees' },
  { label: 'CONTACT', href: '/contact' },
]

const membershipItems = [
  { label: 'INDIVIDUAL MEMBERSHIP', href: '/register/individual' },
  { label: 'CORPORATE MEMBERSHIP', href: '/register/corporate' },
]

function FooterSocialIcon({ platform }) {
  if (platform === 'instagram') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Z" /><path fillRule="evenodd" d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" /><circle cx="17.5" cy="6.5" r="1.25" /></svg>
  }
  if (platform === 'linkedin') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9h3v10H5zM6.5 5a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5ZM11 9h2.9v1.4h.05A3.2 3.2 0 0 1 16.8 8.8c3.1 0 3.7 2 3.7 4.6V19h-3v-5c0-1.2 0-2.7-1.7-2.7s-2 1.3-2 2.6V19h-3z" /></svg>
  }
  if (platform === 'facebook') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.4 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2v2.3H7.5v3.1h2.7v8z" /></svg>
  }
  if (platform === 'youtube') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23 7.1a3 3 0 0 0-2.1-2.2C19 4.4 12 4.4 12 4.4s-7 0-8.9.5A3 3 0 0 0 1 7.1a31 31 0 0 0-.5 4.9 31 31 0 0 0 .5 4.9 3 3 0 0 0 2.1 2.2c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.2 31 31 0 0 0 .5-4.9 31 31 0 0 0-.5-4.9ZM9.7 15.5v-7l6.1 3.5z" /></svg>
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.8 5.8 22H2.6l7.3-8.4L1 2h6.5l4.5 6.7zm-1.1 18h1.7L6.5 3.9H4.7z" /></svg>
}

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="editorial-footer">
      <div className="footer-layout">
        <div className="footer-brand">
          <img src="/wista-logo-singapore-white.svg" alt="WISTA Singapore" />
        </div>

        <div className="footer-socials" role="group" aria-label="WISTA Singapore social media">
          {socialLinks.map(({ platform, label, url }) => {
            const icon = <FooterSocialIcon platform={platform} />
            return url ? (
              <a key={platform} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}>
                {icon}
              </a>
            ) : (
              <span key={platform} className="footer-social-unconfigured" role="img" aria-label={`${label}; link not configured`}>
                {icon}
              </span>
            )
          })}
        </div>

        <address className="footer-contact">
          <p className="footer-heading">WISTA SINGAPORE</p>
          <p>8 Burn Road, #15-05 Trivex<br />Singapore 369977</p>
        </address>

        <nav className="footer-navigation" aria-label="Footer navigation">
          <p className="footer-heading">EXPLORE</p>
          <div className="footer-navigation-links">
            {navItems.map((item) => (
              <Link key={item.href} to={item.href}>{item.label}</Link>
            ))}
          </div>
        </nav>

        <div className="footer-membership">
          <p className="footer-heading">MEMBERSHIP</p>
          <div className="footer-membership-links">
            {membershipItems.map((item) => (
              <Link key={item.href} to={item.href}>{item.label}</Link>
            ))}
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {currentYear} WISTA Singapore. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
