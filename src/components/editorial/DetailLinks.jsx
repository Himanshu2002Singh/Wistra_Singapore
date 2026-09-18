import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

export default function DetailLinks({ base = '', items = [] }) {
  return (
    <div className="detail-links">
      {items.map((item) => (
        <Link to={`${base}/${item.toLowerCase().replaceAll(' ', '-')}`} key={item}>
          {item}
          <ArrowUpRight size={16} />
        </Link>
      ))}
    </div>
  )
}
