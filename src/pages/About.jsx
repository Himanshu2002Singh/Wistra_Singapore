import React from 'react'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import CardGrid from '@/components/editorial/CardGrid'

export default function About() {
  return (
    <PageShell currentPage="ABOUT">
      <PageIntro 
        eyebrow="01 — ABOUT WISTA SINGAPORE" 
        title={<>Women moving <em>maritime</em> forward.</>} 
        lead="WISTA Singapore is a networking organization for women at the management level in the maritime, trading and logistics sectors."
      />
      <section className="route-section content-white">
        <h2>A network built on <em>connection.</em></h2>
        <CardGrid items={[
          ["OUR PURPOSE", "We create a place for women to connect, learn and lead across Singapore's maritime world."],
          ["OUR MISSION", "Empowering women through networking, education and advocacy in Singapore's shipping, trading and logistics ecosystem."],
          ["OUR FUTURE", "We work toward a more diverse, inclusive and resilient maritime industry for generations to come."]
        ]} />
      </section>
    </PageShell>
  )
}
