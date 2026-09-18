import React from 'react'
import ArrowLink from './ArrowLink'

export default function CardGrid({ items = [] }) {
  return (
    <div className="card-grid">
      {items.map(([title, text], index) => (
        <article className="editorial-card" key={title}>
          <span className="card-index">0{index + 1}</span>
          <h2>{title}</h2>
          <p>{text}</p>
          <ArrowLink href="#">Explore story</ArrowLink>
        </article>
      ))}
    </div>
  )
}
