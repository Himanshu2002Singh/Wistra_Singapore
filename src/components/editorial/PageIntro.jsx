import React from 'react'

export default function PageIntro({ eyebrow, title, lead }) {
  return (
    <section className="page-intro section-pad">
      <p className="eyebrow">
        <i />{eyebrow}
      </p>
      <h1>{title}</h1>
      <p className="page-lead">{lead}</p>
    </section>
  )
}
