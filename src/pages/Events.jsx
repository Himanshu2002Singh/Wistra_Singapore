import React, { useState } from 'react'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import DetailLinks from '@/components/editorial/DetailLinks'
import Lightbox from '@/components/ui/Lightbox'
import ScrollReveal from '@/components/ui/ScrollReveal'
import { events } from '@/data/events'

// Exclusive Curated Hero Background Image for Events
import eventsHeroBg from '../assets/images/wista/hero/events-hero-bg.jpg'

export default function Events() {
  const [activeLightbox, setActiveLightbox] = useState(null)

  return (
    <PageShell currentPage="EVENTS">
      {activeLightbox && (
        <Lightbox 
          src={activeLightbox.src} 
          alt={activeLightbox.title} 
          caption={activeLightbox.caption} 
          onClose={() => setActiveLightbox(null)} 
        />
      )}
      <PageIntro 
        eyebrow="03 — EVENTS &amp; FORUMS" 
        title={<>Where <em>people</em><br />meet.</>} 
        lead="From local networking evenings to industry panel discussions and international naval exchanges, WISTA Singapore events turn conversations into momentum."
        bgImage={eventsHeroBg}
        bgPosition="center 30%"
      />
      
      <section className="route-section content-white space-y-12">
        <ScrollReveal>
          <h2 className="mb-8">Featured &amp; Past <em>Gatherings.</em></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((evt) => (
              <div key={evt.id} className="group bg-[#f5f3ee] border border-[#0b1f33]/10 rounded-sm overflow-hidden flex flex-col hover:border-[#1b9aaa] transition-colors">
                <div className="aspect-[16/9] overflow-hidden bg-[#0b1f33]/10">
                  <img 
                    src={evt.image} 
                    alt={evt.title} 
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                    onClick={() => setActiveLightbox({ src: evt.image, title: evt.title, caption: `${evt.type} — ${evt.location}` })}
                  />
                </div>
                <div className="p-5 flex flex-col justify-between flex-1 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-[#1b9aaa] uppercase mb-1">
                      <span>{evt.type}</span>
                      <span>{evt.date}</span>
                    </div>
                    <h3 className="text-lg font-bold font-display text-[#0b1f33] leading-snug">{evt.title}</h3>
                    <p className="text-xs text-[#163d5a]/80 mt-2 line-clamp-2">{evt.description}</p>
                  </div>
                  <p className="text-[11px] font-semibold text-[#0b1f33]/60 border-t border-[#0b1f33]/10 pt-3">
                    📍 {evt.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <h2 className="mt-12">Upcoming <em>Moments.</em></h2>
          <DetailLinks base="/events" items={[
            'WISTA Singapore AGM 2026 — Singapore Cricket Club',
            'WISTA Singapore Annual Gala Dinner — Marina Bay Sands',
            'Asia Pacific Maritime 2026 Forum — Sands Expo',
            'WISTA x Royal Navy Maritime Exchange — Port Facilities'
          ]} />
        </ScrollReveal>
      </section>
    </PageShell>
  )
}



