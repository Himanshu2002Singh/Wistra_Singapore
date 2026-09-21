import React, { useState } from 'react'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import Lightbox from '@/components/ui/Lightbox'
import ScrollReveal from '@/components/ui/ScrollReveal'

// Exclusive Curated Images for Gallery
import galleryHeroBg from '../assets/images/wista/hero/gallery-hero-bg.jpg'
import g01 from '../assets/images/wista/gallery/gallery-item-01.jpg'
import g02 from '../assets/images/wista/gallery/gallery-item-02.jpg'
import g03 from '../assets/images/wista/gallery/gallery-item-03.jpg'
import g04 from '../assets/images/wista/gallery/gallery-item-04.jpg'
import g05 from '../assets/images/wista/gallery/gallery-item-05.jpg'
import g06 from '../assets/images/wista/gallery/gallery-item-06.jpg'
import g07 from '../assets/images/wista/gallery/gallery-item-07.jpg'
import g08 from '../assets/images/wista/gallery/gallery-item-08.jpg'
import g09 from '../assets/images/wista/gallery/gallery-item-09.jpg'
import g10 from '../assets/images/wista/gallery/gallery-item-10.jpg'
import g11 from '../assets/images/wista/gallery/gallery-item-11.jpg'
import g12 from '../assets/images/wista/gallery/gallery-item-12.jpg'

const galleryItems = [
  { src: g01, title: 'Executive Gala Toast', caption: 'WISTA Singapore Year-End Gala executive toast' },
  { src: g02, title: 'Member Reception', caption: 'Members networking during executive reception' },
  { src: g03, title: 'Photobooth Celebration', caption: 'Year-End Gala photobooth celebration' },
  { src: g04, title: 'Evening Gathering', caption: 'Singapore maritime leaders evening reception' },
  { src: g05, title: 'Royal Navy Officers Briefing', caption: 'Warship delegation briefing and security tour' },
  { src: g06, title: 'IMO Conference Attendees', caption: 'Global delegates attending IMO maritime symposium' },
  { src: g07, title: 'WIMAR-WISTA Panel', caption: 'Joint panel discussion on women in maritime' },
  { src: g08, title: 'Maritime Forum Speakers', caption: 'Keynote speakers addressing sustainability and trade' },
  { src: g09, title: 'Delegation Group Photo', caption: 'International maritime delegation group portrait' },
  { src: g10, title: 'Shipping Keynote Presentation', caption: 'Presentation on decarbonization and port operations' },
  { src: g11, title: 'Maritime Women Networking', caption: 'Executive women in shipping networking session' },
  { src: g12, title: 'International Delegates', caption: 'Connecting WISTA members across international chapters' }
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
        bgImage={galleryHeroBg}
        bgPosition="center 30%"
      />
      <section className="route-section content-white">
        <ScrollReveal>
          <div className="gallery-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {galleryItems.map((img, i) => (
              <div key={i} className="group relative overflow-hidden bg-[#0b1f33]/5 rounded-sm aspect-[4/3]">
                <img 
                  src={img.src} 
                  alt={img.title} 
                  loading="lazy"
                  onClick={() => setActiveLightbox(img)}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer"
                  data-cursor="OPEN"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1f33]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none p-4 flex flex-col justify-end text-white">
                  <p className="font-bold text-sm tracking-wide">{img.title}</p>
                  <p className="text-xs text-[#8cd4d3] mt-1 line-clamp-1">{img.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>
    </PageShell>
  )
}


