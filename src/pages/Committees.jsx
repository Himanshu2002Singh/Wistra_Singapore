import React from 'react'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import DetailLinks from '@/components/editorial/DetailLinks'

export default function Committees() {
  return (
    <PageShell currentPage="COMMITTEES">
      <PageIntro 
        eyebrow="06 — COMMITTEES" 
        title={<>Expertise<br /><em>in action.</em></>} 
        lead="Our executive committee brings specialist knowledge together to create practical progress for our members and the maritime industry."
      />
      <section className="route-section content-white">
        <h2>Shared <em>direction.</em></h2>
        <DetailLinks base="/committees" items={[
          'Executive Committee & Officers',
          'Events & Networking Committee',
          'Membership & Community Committee',
          'Communications & Media Committee'
        ]} />
      </section>
    </PageShell>
  )
}
