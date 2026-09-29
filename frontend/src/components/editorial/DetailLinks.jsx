import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

export default function DetailLinks({ base = '', items = [], className = '' }) {
  return (
    <div className={`detail-links ${className.trim()}`}>
      {items.map((item) => (
        <Link to={`${base}/${item.toLowerCase().replaceAll(' ', '-')}`} key={item}>
          <span className="detail-link-text">{item}</span>
          <ArrowUpRight size={18} className="shrink-0" />
        </Link>
      ))}
    </div>
  )
}
