import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Eyebrow from '@/components/editorial/Eyebrow'
import ArrowLink from '@/components/editorial/ArrowLink'
import EditorialImage from '@/components/editorial/EditorialImage'
import ScrollReveal from '@/components/ui/ScrollReveal'
import Lightbox from '@/components/ui/Lightbox'

const principles = [
  ['01', 'PROFESSIONAL DEVELOPMENT', 'Knowledge, mentorship and the confidence to lead.'],
  ['02', 'CONNECTING GLOBALLY', 'Relationships that cross oceans, industries and generations.'],
  ['03', 'SINGAPORE CHAPTER', 'Local roots with a shared international direction.'],
  ['04', 'CLOSING THE GENDER GAP', 'A more diverse, inclusive and resilient industry.'],
  ['05', 'EXPERT COMMITTEES', 'A collective voice for the future of maritime in Singapore.'],
]

function HeroMotion() {
  const heroRef = useRef(null)
  useEffect(() => {
    const hero = heroRef.current
    if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const move = (event) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        hero.style.setProperty('--parallax-x', `${(event.clientX / window.innerWidth - 0.5) * -18}px`)
        hero.style.setProperty('--parallax-y', `${(event.clientY / window.innerHeight - 0.5) * -12}px`)
      })
    }
    window.addEventListener('mousemove', move, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('mousemove', move)
    }
  }, [])

  return (
    <section ref={heroRef} className="editorial-hero cinematic-hero">
      <div className="hero-port" />
      <div className="hero-copy">
        <Eyebrow>PEOPLE · OPPORTUNITIES · COLLABORATION</Eyebrow>
        <h1>
          <span className="reveal-line">WOMEN</span>
          <span className="reveal-line offset">MOVING</span>
          <span className="reveal-line teal">MARITIME</span>
          <span className="reveal-line">FORWARD.</span>
        </h1>
        <p>Connecting women across Singapore's maritime, trading and logistics sectors.</p>
        <div className="hero-actions">
          <ArrowLink href="/membership">Join WISTA</ArrowLink>
          <ArrowLink href="/network">Explore our network</ArrowLink>
        </div>
      </div>
      <div className="hero-message">
        Stronger Together<br />
        <em>Across Oceans</em>
        <span className="block text-[8px] font-sans tracking-[0.2em] text-[#8cd4d3] mt-2 font-normal">
          SINGAPORE 01°17′N 103°50′E
        </span>
      </div>
      <div className="hero-stats">
        <div>
          <strong>200<span>+</span></strong>
          <small>MEMBERS<br />IN SINGAPORE</small>
        </div>
        <div>
          <strong>60<span>+</span></strong>
          <small>NATIONAL<br />ASSOCIATIONS</small>
        </div>
        <div>
          <strong>2006</strong>
          <small>SINGAPORE<br />CHAPTER EST.</small>
        </div>
        <div>
          <strong>GLOBAL</strong>
          <small>MARITIME<br />NETWORK</small>
        </div>
      </div>
      <div className="scroll-label">
        SCROLL TO EXPLORE <ArrowDownRight size={15} />
      </div>
    </section>
  )
}

export default function Home() {
  const [activePrinciple, setActivePrinciple] = useState(0)
  const [activeLightbox, setActiveLightbox] = useState(null)

  return (
    <main>
      <Header 
        cinematic={true} 
        currentPage="HOME" 
      />
      {activeLightbox && (
        <Lightbox 
          src={activeLightbox.src} 
          alt={activeLightbox.alt} 
          caption={activeLightbox.caption} 
          onClose={() => setActiveLightbox(null)} 
        />
      )}

      <HeroMotion />

      <ScrollReveal>
        <section className="statement section-pad editorial-about">
          <EditorialImage 
            src="/images/wista/1556605318967.jpeg" 
            alt="WISTA Singapore members gathered in a maritime setting" 
            className="about-photo"
            onClick={() => setActiveLightbox({ src: '/images/wista/1556605318967.jpeg', alt: 'WISTA Singapore members', caption: 'WISTA Singapore Gathering — Waterfront' })}
          />
          <div className="statement-big">
            Singapore's network<br />connecting <em>women</em><br />across maritime<br />and trade.
            <small>WISTA SINGAPORE<br />Women shaping the maritime and trading community.</small>
          </div>
          <div className="statement-side">
            <Eyebrow>WHO WE ARE</Eyebrow>
            <p>WISTA Singapore is a networking organization for women at the management level in the maritime, trading and logistics sectors.</p>
            <ArrowLink href="/about">Discover WISTA</ArrowLink>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="network-feature section-pad">
          <div className="network-feature-copy">
            <Eyebrow>02 — GLOBAL NETWORK</Eyebrow>
            <h2>Connected<br /><em>by the sea.</em></h2>
            <p>Local roots. International direction. WISTA brings women together across Singapore and the world’s maritime community.</p>
            <div className="network-stat">
              <strong>60<span>+</span></strong>
              <small>NATIONAL WISTA ASSOCIATIONS</small>
            </div>
            <ArrowLink href="/network">Explore the network</ArrowLink>
          </div>
          <EditorialImage 
            src="/images/wista/1558629943870.jpeg" 
            alt="WISTA community gathered around a maritime waterfront" 
            className="network-main-photo"
            onClick={() => setActiveLightbox({ src: '/images/wista/1558629943870.jpeg', alt: 'WISTA Waterfront Summit', caption: 'Global WISTA Summit — Maritime Horizon' })}
          />
          <EditorialImage 
            src="/images/wista/1569640560785.jpeg" 
            alt="WISTA members connecting at an event" 
            className="network-offset-photo"
            onClick={() => setActiveLightbox({ src: '/images/wista/1569640560785.jpeg', alt: 'WISTA Networking Event', caption: 'International Member Networking' })}
          />
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="numbers-section section-pad">
          <div className="section-intro">
            <Eyebrow>THE COMMUNITY</Eyebrow>
            <p>One network, thousands of people moving maritime forward.</p>
          </div>
          <div className="community-feature">
            <EditorialImage 
              src="/images/wista/1560693768350.jpeg" 
              alt="WISTA members together at a community gathering" 
              className="community-photo"
              onClick={() => setActiveLightbox({ src: '/images/wista/1560693768350.jpeg', alt: 'WISTA Community', caption: 'WISTA Singapore Annual Forum' })}
            />
            <div className="number-row">
              <div><strong>200<span>+</span></strong><small>SINGAPORE MEMBERS</small></div>
              <div><strong>60<span>+</span></strong><small>ASSOCIATIONS</small></div>
              <div><strong>2006</strong><small>ESTABLISHED</small></div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="principles-section section-pad">
          <div className="principles-heading">
            <Eyebrow>WHAT WE DO</Eyebrow>
            <h2>Move the<br /><em>industry</em><br />forward.</h2>
          </div>
          <div className="principles-list">
            {principles.map(([number, title, desc], index) => (
              <div 
                className={`principle ${activePrinciple === index ? 'active' : ''}`} 
                key={number} 
                onMouseEnter={() => setActivePrinciple(index)}
              >
                <span>{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
                <ArrowUpRight size={21} />
              </div>
            ))}
          </div>
          <EditorialImage 
            src="/images/wista/20190130_215604.jpg" 
            alt="WISTA members sharing a moment together" 
            className="principle-image"
            onClick={() => setActiveLightbox({ src: '/images/wista/20190130_215604.jpg', alt: 'WISTA Principles', caption: 'Professional Development & Leadership' })}
          />
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="image-break">
          <img src="/images/wista/1550569091387.jpeg" alt="Women gathered at a WISTA maritime event" loading="lazy" />
          <div>MORE WOMEN.<br /><span>STRONGER VOICES.</span></div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="events-editorial section-pad">
          <div className="events-top">
            <div>
              <Eyebrow>03 — EVENTS</Eyebrow>
              <h2>Where<br /><em>people</em><br />meet.</h2>
            </div>
            <ArrowLink href="/events">View all events</ArrowLink>
          </div>
          <div className="event-feature">
            <EditorialImage 
              src="/images/wista/20221027_221133.jpg" 
              alt="WISTA members at an international conference" 
              className="event-main-photo"
              onClick={() => setActiveLightbox({ src: '/images/wista/20221027_221133.jpg', alt: 'WISTA Conference', caption: 'Singapore Maritime Conference 2026' })}
            />
            <div>
              <p className="event-date">SINGAPORE MARITIME COMMUNITY</p>
              <h3>Ideas move<br />when people meet.</h3>
              <p className="event-place">A shared room, a wider horizon, and the conversations that carry forward.</p>
              <ArrowLink href="/events">Explore events</ArrowLink>
            </div>
            <EditorialImage 
              src="/images/wista/751554E1-8F89-48C9-9EE2-243590A8B239.jpeg" 
              alt="WISTA event guests networking together" 
              className="event-secondary-photo"
              onClick={() => setActiveLightbox({ src: '/images/wista/751554E1-8F89-48C9-9EE2-243590A8B239.jpeg', alt: 'WISTA Event Guests', caption: 'Networking Evening — Marina Bay' })}
            />
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="initiatives-section section-pad">
          <div>
            <Eyebrow>05 — INITIATIVES</Eyebrow>
            <h2>Stories with<br /><em>momentum.</em></h2>
            <p>Visibility, leadership and practical change for the people shaping maritime.</p>
            <ArrowLink href="/news">Read news &amp; media</ArrowLink>
          </div>
          <EditorialImage 
            src="/images/wista/1561481404960.jpeg" 
            alt="WISTA campaign artwork about women in maritime" 
            className="initiative-photo"
            onClick={() => setActiveLightbox({ src: '/images/wista/1561481404960.jpeg', alt: 'WISTA Initiatives', caption: 'Women in Maritime Campaign' })}
          />
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="gallery-feature section-pad">
          <div>
            <Eyebrow>06 — COMMUNITY</Eyebrow>
            <h2>Across every<br /><em>horizon.</em></h2>
            <p>From formal gatherings to the moments between them, this is a network built on human connection.</p>
            <ArrowLink href="/gallery">Visit the gallery</ArrowLink>
          </div>
          <div className="gallery-images">
            <EditorialImage 
              src="/images/wista/1560693777648.jpeg" 
              alt="WISTA members networking at a maritime gathering"
              onClick={() => setActiveLightbox({ src: '/images/wista/1560693777648.jpeg', alt: 'Community Horizon 1', caption: 'Dockside Networking' })}
            />
            <EditorialImage 
              src="/images/wista/1560693770560.jpeg" 
              alt="WISTA community celebrating together"
              onClick={() => setActiveLightbox({ src: '/images/wista/1560693770560.jpeg', alt: 'Community Horizon 2', caption: 'Community Celebration' })}
            />
            <EditorialImage 
              src="/images/wista/1560693780442.jpeg" 
              alt="WISTA members sharing a cultural moment"
              onClick={() => setActiveLightbox({ src: '/images/wista/1560693780442.jpeg', alt: 'Community Horizon 3', caption: 'Cultural Evening' })}
            />
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="closing-section section-pad">
          <Eyebrow>YOUR PLACE IN THE NETWORK</Eyebrow>
          <h2>People.<br /><em>Opportunities.</em><br />Collaboration.</h2>
          <ArrowLink href="/membership">Become a member</ArrowLink>
          <span className="closing-number">07</span>
        </section>
      </ScrollReveal>

      <Footer />
    </main>
  )
}
