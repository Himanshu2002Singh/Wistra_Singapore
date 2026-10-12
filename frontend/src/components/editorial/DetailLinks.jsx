import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

export default function DetailLinks({ base = '', items = [], className = '' }) {
  return (
    <div className={`detail-links ${className.trim()}`}>
      {items.map((item) => {
        const label = typeof item === 'string' ? item : item.label
        const href = typeof item === 'string' ? `${base}/${item.toLowerCase().replaceAll(' ', '-')}` : item.to
        return (
          <Link to={href} key={label}>
            <span className="detail-link-text">{label}</span>
            <ArrowUpRight size={18} className="shrink-0" />
          </Link>
        )
      })}
    </div>
  )
}
