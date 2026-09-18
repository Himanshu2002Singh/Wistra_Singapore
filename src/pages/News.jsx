import React from 'react'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import CardGrid from '@/components/editorial/CardGrid'

export default function News() {
  return (
    <PageShell currentPage="NEWS & STORIES">
      <PageIntro 
        eyebrow="04 — NEWS & STORIES" 
        title={<>Stories from<br />the <em>industry.</em></>} 
        lead="Ideas, perspectives and people shaping the future of maritime, trade and logistics in Singapore."
      />
      <section className="route-section content-white">
        <CardGrid items={[
          ["WISTA SG Mentorship Launch", "What it means to build a maritime career with confidence."],
          ["Across the Water", "National associations creating local change with global reach."],
          ["Singapore Maritime Week", "Key takeaways and moments from WISTA Singapore's participation."]
        ]} />
      </section>
    </PageShell>
  )
}
