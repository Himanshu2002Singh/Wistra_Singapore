import React, { useState } from 'react'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import CardGrid from '@/components/editorial/CardGrid'
import ArrowLink from '@/components/editorial/ArrowLink'
import EditorialImage from '@/components/editorial/EditorialImage'
import Lightbox from '@/components/ui/Lightbox'
import WorkflowJourney from '@/components/ui/WorkflowJourney'
import ScrollReveal from '@/components/ui/ScrollReveal'

// Exclusive Curated Images for Membership
import membershipHeroBg from '../assets/images/wista/hero/membership-hero-bg.jpg'
import membershipNetworking from '../assets/images/wista/membership/membership-networking.jpg'
import membershipMentoring from '../assets/images/wista/membership/membership-mentoring.jpg'
import membershipReception from '../assets/images/wista/membership/membership-reception.jpg'

export default function Membership() {
  const [activeLightbox, setActiveLightbox] = useState(null)

  return (
    <PageShell currentPage="MEMBERSHIP">
      {activeLightbox && (
        <Lightbox 
          src={activeLightbox.src} 
          alt={activeLightbox.alt} 
          caption={activeLightbox.caption} 
          onClose={() => setActiveLightbox(null)} 
        />
      )}
      <PageIntro 
        eyebrow="05 — MEMBERSHIP" 
        title={<>Find your<br /><em>place.</em></>} 
        lead="Join a vibrant community of professionals who believe Singapore's maritime industry moves forward when everyone has a voice."
        bgImage={membershipHeroBg}
        bgPosition="center 30%"
      />
      
      <section className="route-section content-dark space-y-12">
        <ScrollReveal>
          <h2>More than a<br /><em>membership.</em></h2>
          <CardGrid items={[
            ["CONNECT", "Build meaningful relationships across companies and maritime sectors in Singapore."],
            ["GROW", "Learn through mentorship, workshops, and shared industry expertise."],
            ["LEAD", "Shape a more inclusive future for women in maritime."]
          ]} />
        </ScrollReveal>

        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10">
            <EditorialImage 
              src={membershipNetworking} 
              alt="Active member networking" 
              onClick={() => setActiveLightbox({ src: membershipNetworking, alt: 'Member Networking', caption: 'Active Member Networking — Year-End Gala' })}
            />
            <EditorialImage 
              src={membershipMentoring} 
              alt="Mentorship & Peer Discussion" 
              onClick={() => setActiveLightbox({ src: membershipMentoring, alt: 'Mentorship Exchange', caption: 'Peer Exchange & Global Mentorship' })}
            />
            <EditorialImage 
              src={membershipReception} 
              alt="New Member Welcome Reception" 
              onClick={() => setActiveLightbox({ src: membershipReception, alt: 'Welcome Reception', caption: 'Executive Reception & Member Welcome' })}
            />
          </div>
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


