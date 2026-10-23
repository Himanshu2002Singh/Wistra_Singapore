import React, { useLayoutEffect, useRef } from 'react'
import { MapPin } from 'lucide-react'
import socialLinks from '@/config/socialLinks'
import './TopBar.css'

function SocialIcon({ platform }) {
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

  if (platform === 'twitter') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.8 5.8 22H2.6l7.3-8.4L1 2h6.5l4.5 6.7zm-1.1 18h1.7L6.5 3.9H4.7z" /></svg>
  }

  return null
}

export default function TopBar() {
  const topbarRef = useRef(null)

  useLayoutEffect(() => {
    const topbar = topbarRef.current
    if (!topbar || typeof ResizeObserver === 'undefined') return undefined

    const updateOffset = () => {
      document.documentElement.style.setProperty('--public-topbar-height', `${Math.ceil(topbar.getBoundingClientRect().height)}px`)
    }
    const observer = new ResizeObserver(updateOffset)
    observer.observe(topbar)
    updateOffset()

    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty('--public-topbar-height')
    }
  }, [])

  return (
    <>
      <div className="public-topbar-spacer" aria-hidden="true" />
      <div ref={topbarRef} className="public-topbar" role="region" aria-label="WISTA Singapore contact and social links">
        <div className="public-topbar-inner">
          <div className="public-topbar-contact" role="group" aria-label="WISTA Singapore office address">
            <address className="public-topbar-address">
              <MapPin size={13} aria-hidden="true" />
              <span>8 Burn Road, #15-05 Trivex, Singapore 369977</span>
            </address>
          </div>

          <div className="public-topbar-socials" role="group" aria-label="WISTA social media">
            {socialLinks.filter(({ url }) => Boolean(url)).map(({ platform, label, url }) => (
              <a key={platform} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}>
                <SocialIcon platform={platform} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
