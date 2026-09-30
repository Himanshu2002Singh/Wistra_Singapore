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
        title={<>WHAT&apos;S<br /><em>HAPPENING</em></>}
        lead="From local networking evenings to industry panel discussions and international naval exchanges, WISTA Singapore events turn conversations into momentum."
        bgImage={eventsHeroBg}
        bgPosition="center 30%"
        variant="image-left"
      />
      
      <section className="route-section content-white space-y-12">
        <ScrollReveal>
          <h2 className="mb-8">Featured &amp; Past <em>Gatherings.</em></h2>
          <div className="event-editorial-list">
            {events.map((evt, index) => (
              <article key={evt.id} className={`event-editorial-card ${index === 0 ? 'event-editorial-card--featured' : ''}`}>
                <div className="event-editorial-image">
                  <img 
                    src={evt.image} 
                    alt={evt.title} 
                    loading="lazy"
                    className="cursor-pointer"
                    onClick={() => setActiveLightbox({ src: evt.image, title: evt.title, caption: `${evt.type} — ${evt.location}` })}
                  />
                </div>
                <div className="event-editorial-copy">
                  <div>
                    <div className="event-editorial-meta">
                      <span>{evt.type}</span>
                      <time className="event-editorial-date" dateTime={evt.date}>
                        <span>{evt.date.slice(8, 10)}</span>
                        <span>{new Date(`${evt.date}T00:00:00`).toLocaleDateString('en-SG', { month: 'short', year: 'numeric' })}</span>
                      </time>
                    </div>
                    <h3>{evt.title}</h3>
                    <p>{evt.description}</p>
                  </div>
                  <p className="event-editorial-location">
                    {evt.location}
                  </p>
                </div>
              </article>
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
