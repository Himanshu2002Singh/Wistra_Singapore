import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

export default function ArrowLink({ children, href = '#', external = false }) {
  if (external) {
    return (
      <a className="editorial-link" href={href} target="_blank" rel="noreferrer">
        {children}<ArrowUpRight size={16} />
      </a>
    )
  }
  return (
    <Link className="editorial-link" to={href}>
      {children}<ArrowUpRight size={16} />
    </Link>
  )
}
