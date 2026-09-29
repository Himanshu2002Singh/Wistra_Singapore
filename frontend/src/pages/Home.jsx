import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Eyebrow from '@/components/editorial/Eyebrow'
import ArrowLink from '@/components/editorial/ArrowLink'
import EditorialImage from '@/components/editorial/EditorialImage'
import ScrollReveal from '@/components/ui/ScrollReveal'
import Lightbox from '@/components/ui/Lightbox'

// Exclusive Curated WISTA Image Imports for Home
import homeHeroBg from '../assets/images/wista/hero/home-hero-bg.jpg'
import homeWelcome from '../assets/images/wista/home/home-welcome.jpg'
import homeNetwork1 from '../assets/images/wista/home/home-network-1.jpg'
import homeNetwork2 from '../assets/images/wista/home/home-network-2.jpg'
import homeCommunity from '../assets/images/wista/home/home-community.jpg'
import homePrinciples from '../assets/images/wista/home/home-principles.jpg'
import homeBreak from '../assets/images/wista/home/home-break.jpg'
import homeEventMain from '../assets/images/wista/home/home-event-main.jpg'
import homeEventSec from '../assets/images/wista/home/home-event-sec.jpg'
import homeInitiative from '../assets/images/wista/home/home-initiative.jpg'
import homeGal1 from '../assets/images/wista/home/home-gal-1.jpg'
import homeGal2 from '../assets/images/wista/home/home-gal-2.jpg'
import homeGal3 from '../assets/images/wista/home/home-gal-3.jpg'

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
    <section ref={heroRef} className="editorial-hero cinematic-hero relative overflow-hidden bg-[#0b1f33]">
      <div 
        className="absolute inset-0 bg-cover scale-105 pointer-events-none transition-transform duration-1000"
        style={{ backgroundImage: `url(${homeHeroBg})`, backgroundPosition: 'center 30%' }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b1f33]/90 via-[#0b1f33]/65 to-[#0b1f33]/30 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b1f33] via-transparent to-transparent pointer-events-none" />
      <div className="hero-copy relative z-10">

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
      <div className="hero-message relative z-10">
        Stronger Together<br />
        <em>Across Oceans</em>
        <span className="block text-[8px] font-sans tracking-[0.2em] text-[#8cd4d3] mt-2 font-normal">
          SINGAPORE 01°17′N 103°50′E
        </span>
      </div>
      <div className="hero-stats relative z-10">
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
            src={homeWelcome} 
            alt="President Yukie Teo addressing WISTA Singapore keynote speech" 
            className="about-photo"
            onClick={() => setActiveLightbox({ src: homeWelcome, alt: 'President Yukie Teo Stage Keynote', caption: 'Yukie Teo — President, WISTA Singapore delivering keynote speech' })}
          />
          <div className="statement-big">
            Singapore's network<br />connecting <em>women</em><br />across maritime<br />and trade.
            <small>WISTA SINGAPORE<br />Led by President Yukie Teo &amp; Executive Committee.</small>
          </div>
          <div className="statement-side">
            <Eyebrow>PRESIDENT'S WELCOME</Eyebrow>
            <p>Welcome to WISTA Singapore. We are a premier professional network bringing together executive women across shipping, trading, and port logistics in Singapore.</p>
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
            src={homeNetwork1} 
            alt="WISTA International Barcelona Congress delegation" 
            className="network-main-photo"
            onClick={() => setActiveLightbox({ src: homeNetwork1, alt: 'WISTA International Congress', caption: 'Global WISTA International Congress Delegation' })}
          />
          <EditorialImage 
            src={homeNetwork2} 
            alt="WISTA Singapore members networking" 
            className="network-offset-photo"
            onClick={() => setActiveLightbox({ src: homeNetwork2, alt: 'WISTA Networking', caption: 'Singapore Executive Networking Session' })}
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
              src={homeCommunity} 
              alt="WISTA Singapore members community gathering" 
              className="community-photo"
              onClick={() => setActiveLightbox({ src: homeCommunity, alt: 'WISTA Community', caption: 'WISTA Singapore Annual Forum Delegation' })}
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
            src={homePrinciples} 
            alt="WISTA Singapore Year-End Gala executive reception" 
            className="principle-image"
            onClick={() => setActiveLightbox({ src: homePrinciples, alt: 'Executive Reception', caption: 'Professional Development & Executive Leadership' })}
          />
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="image-break">
          <img src={homeBreak} alt="Royal Navy warship deck view looking out over Singapore strait" loading="lazy" />
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
              src={homeEventMain} 
              alt="WISTA Singapore Annual Gala" 
              className="event-main-photo"
              onClick={() => setActiveLightbox({ src: homeEventMain, alt: 'WISTA Annual Gala', caption: 'WISTA Singapore Annual Gala — Marina Bay Sands' })}
            />
            <div>
              <p className="event-date">SINGAPORE MARITIME COMMUNITY</p>
              <h3>Ideas move<br />when people meet.</h3>
              <p className="event-place">A shared room, a wider horizon, and the conversations that carry forward.</p>
              <ArrowLink href="/events">Explore events</ArrowLink>
            </div>
            <EditorialImage 
              src={homeEventSec} 
              alt="Asia Pacific Maritime panel" 
              className="event-secondary-photo"
              onClick={() => setActiveLightbox({ src: homeEventSec, alt: 'APM 2024 Panel', caption: 'Asia Pacific Maritime Executive Panel' })}
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
            src={homeInitiative} 
            alt="WISTA Singapore Silver Anniversary milestone awards" 
            className="initiative-photo"
            onClick={() => setActiveLightbox({ src: homeInitiative, alt: '25th Anniversary Milestone', caption: 'WISTA Singapore 25 Years of Leadership & Honors' })}
          />
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="gallery-feature section-pad">
          <div>
            <Eyebrow>06 — COMMUNITY</Eyebrow>
            <h2>Across every<br /><em>horizon.</em></h2>
            <p>From formal gatherings to naval deck exchanges, this is a network built on human connection.</p>
            <ArrowLink href="/gallery">Visit the gallery</ArrowLink>
          </div>
          <div className="gallery-images">
            <EditorialImage 
              src={homeGal1} 
              alt="Keppel Bay dockside networking"
              onClick={() => setActiveLightbox({ src: homeGal1, alt: 'Dockside Networking', caption: 'Dockside Networking & Gathering' })}
            />
            <EditorialImage 
              src={homeGal2} 
              alt="Community celebration gathering"
              onClick={() => setActiveLightbox({ src: homeGal2, alt: 'Community Celebration', caption: 'WISTA Community Celebration' })}
            />
            <EditorialImage 
              src={homeGal3} 
              alt="Cultural networking evening"
              onClick={() => setActiveLightbox({ src: homeGal3, alt: 'Cultural Evening', caption: 'Cultural Networking Evening' })}
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


