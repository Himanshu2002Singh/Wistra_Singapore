import React from 'react'

export default function PageIntro({ eyebrow, title, lead, bgImage, bgPosition = 'center', variant = 'curve-right' }) {
  return (
    <section className={`page-intro editorial-page-hero editorial-page-hero--${variant} ${bgImage ? 'has-image' : ''}`}>
      {bgImage && (
        <div className="page-hero-image" aria-hidden="true">
          <img src={bgImage} alt="" style={{ objectPosition: bgPosition }} />
        </div>
      )}
      <div className="page-hero-copy">
        <p className="eyebrow">
          <i />{eyebrow}
        </p>
        <h1>{title}</h1>
        <p className="page-lead">{lead}</p>
      </div>
      <span className="page-hero-rule" aria-hidden="true" />
    </section>
  )
}

