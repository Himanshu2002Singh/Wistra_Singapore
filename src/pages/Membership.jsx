import React from 'react'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import CardGrid from '@/components/editorial/CardGrid'
import ArrowLink from '@/components/editorial/ArrowLink'
import WorkflowJourney from '@/components/ui/WorkflowJourney'
import ScrollReveal from '@/components/ui/ScrollReveal'

export default function Membership() {
  return (
    <PageShell currentPage="MEMBERSHIP">
      <PageIntro 
        eyebrow="05 — MEMBERSHIP" 
        title={<>Find your<br /><em>place.</em></>} 
        lead="Join a vibrant community of professionals who believe Singapore's maritime industry moves forward when everyone has a voice."
      />
      
      <section className="route-section content-dark">
        <ScrollReveal>
          <h2>More than a<br /><em>membership.</em></h2>
          <CardGrid items={[
            ["CONNECT", "Build meaningful relationships across companies and maritime sectors in Singapore."],
            ["GROW", "Learn through mentorship, workshops, and shared industry expertise."],
            ["LEAD", "Shape a more inclusive future for women in maritime."]
          ]} />
        </ScrollReveal>

        <ScrollReveal delay={1}>
          <WorkflowJourney />
        </ScrollReveal>

        <ScrollReveal delay={2}>
          <div style={{ marginTop: 50 }}>
            <ArrowLink href="https://forms.gle/29TduhWZyE4cf299A" external={true}>Apply for Individual Membership</ArrowLink>
          </div>
          <div style={{ marginTop: 20 }}>
            <ArrowLink href="https://forms.gle/Zbm3H6tD4A8iYCvZA" external={true}>Apply for Corporate Membership</ArrowLink>
          </div>
        </ScrollReveal>
      </section>
    </PageShell>
  )
}
