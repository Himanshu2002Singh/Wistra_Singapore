import React from 'react'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import DetailLinks from '@/components/editorial/DetailLinks'

export default function Events() {
  return (
    <PageShell currentPage="EVENTS">
      <PageIntro 
        eyebrow="03 — EVENTS" 
        title={<>Where <em>people</em><br />meet.</>} 
        lead="From local networking evenings to industry panel discussions, WISTA Singapore events turn conversations into momentum."
      />
      <section className="route-section content-white">
        <h2>Upcoming <em>moments.</em></h2>
        <DetailLinks base="/events" items={[
          'WISTA Singapore AGM 2026 — Singapore Cricket Club',
          'Maritime Networking Night — Marina Bay Sands',
          'Women in Shipping Panel — PSA Horizons',
          'Tech in Maritime Symposium — Suntec Convention Centre'
        ]} />
      </section>
    </PageShell>
  )
}
