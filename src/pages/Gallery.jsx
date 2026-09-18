import React, { useState } from 'react'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import Lightbox from '@/components/ui/Lightbox'
import ScrollReveal from '@/components/ui/ScrollReveal'

const images = [
  { src: '/images/wista/1550569091387.jpeg', title: 'Maritime Assembly', caption: 'WISTA Singapore Annual Gathering' },
  { src: '/images/wista/1556605318967.jpeg', title: 'Waterfront Summit', caption: 'Members connecting along the Singapore waterfront' },
  { src: '/images/wista/1558629943870.jpeg', title: 'Global Connections', caption: 'International maritime delegation in Singapore' },
  { src: '/images/wista/1560693768350.jpeg', title: 'Industry Leadership', caption: 'Women leaders sharing insights at WISTA forum' },
  { src: '/images/wista/1560693770560.jpeg', title: 'Community Celebration', caption: 'Celebrating milestones and achievements' },
  { src: '/images/wista/1560693777648.jpeg', title: 'Dockside Networking', caption: 'Informal networking event at Keppel Bay' }
]

export default function Gallery() {
  const [activeLightbox, setActiveLightbox] = useState(null)

  return (
    <PageShell currentPage="GALLERY">
      {activeLightbox && (
        <Lightbox 
          src={activeLightbox.src} 
          alt={activeLightbox.title} 
          caption={`${activeLightbox.title} — ${activeLightbox.caption}`} 
          onClose={() => setActiveLightbox(null)} 
        />
      )}
      <PageIntro 
        eyebrow="07 — GALLERY" 
        title={<>A visual<br /><em>archive.</em></>} 
        lead="A glimpse into the people, places and moments that move our network forward."
      />
      <section className="route-section content-white">
        <ScrollReveal>
          <div className="gallery-grid">
            {images.map((img, i) => (
              <img 
                key={i} 
                src={img.src} 
                alt={img.title} 
                onClick={() => setActiveLightbox(img)}
                style={{ cursor: 'pointer' }}
                data-cursor="OPEN"
              />
            ))}
          </div>
        </ScrollReveal>
      </section>
    </PageShell>
  )
}
