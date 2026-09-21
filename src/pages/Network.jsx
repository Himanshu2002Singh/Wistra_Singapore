import React, { useState } from 'react'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import DetailLinks from '@/components/editorial/DetailLinks'
import EditorialImage from '@/components/editorial/EditorialImage'
import Lightbox from '@/components/ui/Lightbox'
import ScrollReveal from '@/components/ui/ScrollReveal'

// Exclusive Curated Images for Network
import networkHeroBg from '../assets/images/wista/hero/network-hero-bg.jpg'
import networkMaritime1 from '../assets/images/wista/network/network-maritime-1.jpg'
import networkMaritime2 from '../assets/images/wista/network/network-maritime-2.jpg'

export default function Network() {
  const [activeLightbox, setActiveLightbox] = useState(null)

  return (
    <PageShell currentPage="MEMBER DIRECTORY">
      {activeLightbox && (
        <Lightbox 
          src={activeLightbox.src} 
          alt={activeLightbox.alt} 
          caption={activeLightbox.caption} 
          onClose={() => setActiveLightbox(null)} 
        />
      )}
      <PageIntro 
        eyebrow="02 — THE NETWORK" 
        title={<>One world.<br /><em>Many</em> voices.</>} 
        lead="Explore the companies, leaders and global associations that make WISTA Singapore a vibrant maritime community."
        bgImage={networkHeroBg}
        bgPosition="center 30%"
      />
      
      <section className="route-section content-dark space-y-12">
        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <EditorialImage 
              src={networkMaritime1} 
              alt="Warship delegation inspection" 
              onClick={() => setActiveLightbox({ src: networkMaritime1, alt: 'Warship Inspection', caption: 'Singapore Maritime Delegation Inspection & Briefing' })}
            />
            <EditorialImage 
              src={networkMaritime2} 
              alt="Global shipping directory feature" 
              onClick={() => setActiveLightbox({ src: networkMaritime2, alt: 'Global Shipping Feature', caption: 'Global Shipping & Logistics Leadership' })}
            />
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <h2>Singapore <em>directory.</em></h2>
          <DetailLinks 
            className="network-directory-links"
            base="/network" 
            items={[
              'PSA International',
              'Pacific International Lines (PIL)',
              'Keppel Offshore & Marine',
              'BW Group',
              'Eastern Pacific Shipping',
              'Swire Shipping'
            ]} 
          />
        </ScrollReveal>
      </section>
    </PageShell>
  )
}


