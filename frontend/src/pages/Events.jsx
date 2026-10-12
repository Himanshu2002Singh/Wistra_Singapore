import React, { useEffect, useState } from 'react'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import Eyebrow from '@/components/editorial/Eyebrow'
import ArrowLink from '@/components/editorial/ArrowLink'
import EditorialImage from '@/components/editorial/EditorialImage'
import Lightbox from '@/components/ui/Lightbox'
import ScrollReveal from '@/components/ui/ScrollReveal'
import { getPublishedEventsApi } from '@/services/publicContentService'

// Exclusive Curated Hero Background Image for Events
import eventsHeroBg from '../assets/images/wista/client-provided/wista-pink-ribbon-walk.jpg'
import eventsIntroImage from '../assets/images/wista/client-provided/wista-community-gathering.jpg'
import eventsCommunityImage from '../assets/images/wista/client-provided/wista-member-gala-dinner.jpg'
import eventsFeaturedImage from '../assets/images/wista/client-provided/wista-team-committee.jpg'
import eventCard1 from '../assets/images/wista/events/event-card-1.jpg'
import eventCard2 from '../assets/images/wista/events/event-card-2.jpg'
import eventCard3 from '../assets/images/wista/events/event-card-3.jpg'
import eventCard4 from '../assets/images/wista/events/event-card-4.jpg'
import eventCard5 from '../assets/images/wista/events/event-card-5.jpg'
import eventCard6 from '../assets/images/wista/events/event-card-6.jpg'

const eventImages = [eventCard1, eventCard2, eventCard3, eventCard4, eventCard5, eventCard6]

function eventDate(date, options) {
  return new Intl.DateTimeFormat('en-SG', { ...options, timeZone: 'Asia/Singapore' }).format(new Date(date))
}

function EventImageButton({ event, imageSrc = event.image, className = '', onOpen }) {
  return (
    <button
      type="button"
      className={`events-image-button ${className}`}
      aria-label={`View photo for ${event.title}`}
      onClick={() => onOpen(event, imageSrc)}
    >
      <img src={imageSrc} alt={event.title} loading="lazy" />
      <span className="events-image-rule" aria-hidden="true" />
    </button>
  )
}

export default function Events() {
  const [activeLightbox, setActiveLightbox] = useState(null)
  const [eventState, setEventState] = useState({ events: [], loading: true, error: false })

  useEffect(() => {
    let active = true
    getPublishedEventsApi()
      .then((response) => {
        if (!active) return
        const rows = Array.isArray(response?.data?.events) ? response.data.events : []
        const events = rows.map((event, index) => ({
          id: event.id,
          title: event.title,
          date: event.starts_at,
          location: event.location,
          type: event.event_type,
          description: event.description,
          image: eventImages[index % eventImages.length],
        }))
        setEventState({ events, loading: false, error: false })
      })
      .catch(() => { if (active) setEventState({ events: [], loading: false, error: true }) })

    return () => { active = false }
  }, [])

  const today = Date.now()
  const upcomingEvents = eventState.events.filter((event) => new Date(event.date).getTime() >= today).sort((a, b) => new Date(a.date) - new Date(b.date))
  const pastEvents = eventState.events.filter((event) => new Date(event.date).getTime() < today).sort((a, b) => new Date(b.date) - new Date(a.date))
  const openEventImage = (event, imageSrc = event.image) => setActiveLightbox({ src: imageSrc, title: event.title, caption: `${event.type} — ${event.location}` })

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
        bgPosition="center 55%"
        variant="image-left"
      />

      <ScrollReveal>
        <section className="events-intro-section section-pad">
          <div className="events-intro-copy">
            <Eyebrow>03 — THE EVENT JOURNAL</Eyebrow>
            <h2>Events that connect the <em>maritime community.</em></h2>
            <p>From local networking evenings to industry panel discussions and international naval exchanges, WISTA Singapore events turn conversations into momentum.</p>
          </div>
          <EditorialImage
            src={eventsIntroImage}
            alt="WISTA members and maritime professionals together at a community gathering"
            className="events-intro-image"
            onClick={() => setActiveLightbox({ src: eventsIntroImage, title: 'WISTA community gathering', caption: 'WISTA Singapore community gathering' })}
          />
        </section>
      </ScrollReveal>

      {upcomingEvents[0] && (
        <ScrollReveal>
          <section className="events-featured-section section-pad" aria-labelledby="events-featured-heading">
            <div className="events-section-heading">
              <Eyebrow>01 — FEATURED EVENT</Eyebrow>
              <span>UP NEXT IN SINGAPORE</span>
            </div>
            <article className="events-featured-layout">
              <EventImageButton event={upcomingEvents[0]} imageSrc={eventsFeaturedImage} className="events-featured-image" onOpen={openEventImage} />
              <div className="events-featured-copy">
                <time className="events-featured-date" dateTime={upcomingEvents[0].date}>
                  <span>{eventDate(upcomingEvents[0].date, { day: '2-digit' })}</span>
                  <span>{eventDate(upcomingEvents[0].date, { month: 'short', year: 'numeric' })}</span>
                </time>
                <p className="events-featured-type">{upcomingEvents[0].type}</p>
                <h2 id="events-featured-heading">{upcomingEvents[0].title}</h2>
                <p className="events-featured-description">{upcomingEvents[0].description}</p>
                <p className="events-featured-location">{upcomingEvents[0].location}</p>
                <ArrowLink href="#upcoming-events">View the event programme</ArrowLink>
              </div>
            </article>
          </section>
        </ScrollReveal>
      )}

      <ScrollReveal>
        <section id="upcoming-events" className="events-upcoming-section section-pad" aria-labelledby="events-upcoming-heading">
          <div className="events-list-heading">
            <div>
              <Eyebrow>02 — SAVE THE DATE</Eyebrow>
              <h2 id="events-upcoming-heading">Upcoming <em>events.</em></h2>
            </div>
            <span className="events-list-count">{upcomingEvents.length} UPCOMING EVENTS</span>
          </div>
          <ol className="events-upcoming-list">
            {upcomingEvents.slice(1).map((event, index) => (
              <li className="events-upcoming-row" key={event.id}>
                <span className="events-upcoming-number">0{index + 2}</span>
                <time dateTime={event.date} className="events-upcoming-date">
                  <span>{eventDate(event.date, { day: '2-digit' })}</span>
                  <span>{eventDate(event.date, { month: 'short', year: 'numeric' })}</span>
                </time>
                <div className="events-upcoming-copy">
                  <p>{event.type}</p>
                  <h3>{event.title}</h3>
                  <span>{event.location}</span>
                  <p className="events-upcoming-description">{event.description}</p>
                </div>
                <EventImageButton event={event} className="events-upcoming-image" onOpen={openEventImage} />
                <button type="button" className="events-upcoming-view" onClick={() => openEventImage(event)} aria-label={`View ${event.title}`}>
                  <span aria-hidden="true">↗</span>
                </button>
              </li>
            ))}
            {!eventState.loading && !eventState.error && !upcomingEvents.length && <li className="events-upcoming-row">There are no published upcoming events.</li>}
          </ol>
          {eventState.loading && <p className="mt-5 text-sm text-slate-600" role="status">Loading published events…</p>}
          {eventState.error && <p className="mt-5 text-sm text-slate-600" role="status">Published events are temporarily unavailable. Please try again later.</p>}
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="events-community-section section-pad">
          <div className="events-community-copy">
            <Eyebrow>03 — TOGETHER, IN PERSON</Eyebrow>
            <h2>Connect.<br /><em>Learn.</em><br />Lead.</h2>
          </div>
          <EditorialImage
            src={eventsCommunityImage}
            alt="WISTA Singapore members gathered at a gala dinner"
            className="events-community-image"
            onClick={() => setActiveLightbox({ src: eventsCommunityImage, title: 'WISTA Singapore members at a gala dinner', caption: 'WISTA Singapore members at a gala dinner' })}
          />
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="events-archive-section section-pad" aria-labelledby="events-archive-heading">
          <div className="events-archive-heading">
            <div>
              <Eyebrow>04 — FROM THE ARCHIVE</Eyebrow>
              <h2 id="events-archive-heading">Past <em>events.</em></h2>
            </div>
            <span>RECENT GATHERINGS &amp; INDUSTRY EXCHANGES</span>
          </div>
          <div className="events-archive-mosaic">
            {pastEvents.map((event, index) => (
              <article className={`events-archive-entry events-archive-entry--${index + 1}`} key={event.id}>
                <EventImageButton event={event} className="events-archive-image" onOpen={openEventImage} />
                <div className="events-archive-caption">
                  <span>0{index + 1} <i>—</i> {eventDate(event.date, { month: 'short', year: 'numeric' })}</span>
                  <h3>{event.title}</h3>
                  <p>{event.location}</p>
                </div>
              </article>
            ))}
            {!eventState.loading && !eventState.error && !pastEvents.length && <p className="text-sm text-slate-600">There are no past published events.</p>}
          </div>
          {eventState.loading && <p className="mt-5 text-sm text-slate-600" role="status">Loading event archive…</p>}
          {eventState.error && <p className="mt-5 text-sm text-slate-600" role="status">The event archive is temporarily unavailable.</p>}
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="events-closing-section section-pad">
          <Eyebrow>WISTA SINGAPORE</Eyebrow>
          <h2>Make room for the <em>next conversation.</em></h2>
        </section>
      </ScrollReveal>
    </PageShell>
  )
}
