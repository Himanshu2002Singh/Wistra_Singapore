import React from 'react'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import DetailLinks from '@/components/editorial/DetailLinks'

export default function Network() {
  return (
    <PageShell currentPage="MEMBER DIRECTORY">
      <PageIntro 
        eyebrow="02 — THE NETWORK" 
        title={<>One world.<br /><em>Many</em> voices.</>} 
        lead="Explore the companies and members that make WISTA Singapore a vibrant maritime community."
      />
      <section className="route-section content-dark">
        <h2>Singapore <em>directory.</em></h2>
        <DetailLinks base="/network" items={[
          'PSA International',
          'Pacific International Lines (PIL)',
          'Keppel Offshore & Marine',
          'BW Group',
          'Eastern Pacific Shipping',
          'Swire Shipping'
        ]} />
      </section>
    </PageShell>
  )
}
