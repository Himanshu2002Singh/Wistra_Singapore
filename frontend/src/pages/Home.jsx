import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowRight, UserRound, Building2 } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Eyebrow from '@/components/editorial/Eyebrow'
import ArrowLink from '@/components/editorial/ArrowLink'
import EditorialImage from '@/components/editorial/EditorialImage'
import ScrollReveal from '@/components/ui/ScrollReveal'
import Lightbox from '@/components/ui/Lightbox'
import socialLinks from '@/config/socialLinks'

// Exclusive Curated WISTA Image Imports for Home
import homeHeroBg from '../assets/images/wista/hero/wista-ssa-41st-anniversary-gala.jpg'
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

function SocialIcon({ platform }) {
  if (platform === 'instagram') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Z" /><path fillRule="evenodd" d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" /><circle cx="17.5" cy="6.5" r="1.25" /></svg>
  }
  if (platform === 'linkedin') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9h3v10H5zM6.5 5a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5ZM11 9h2.9v1.4h.05A3.2 3.2 0 0 1 16.8 8.8c3.1 0 3.7 2 3.7 4.6V19h-3v-5c0-1.2 0-2.7-1.7-2.7s-2 1.3-2 2.6V19h-3z" /></svg>
  }
  if (platform === 'facebook') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.4 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2v2.3H7.5v3.1h2.7v8z" /></svg>
  }
  if (platform === 'youtube') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23 7.1a3 3 0 0 0-2.1-2.2C19 4.4 12 4.4 12 4.4s-7 0-8.9.5A3 3 0 0 0 1 7.1a31 31 0 0 0-.5 4.9 31 31 0 0 0 .5 4.9 3 3 0 0 0 2.1 2.2c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.2 31 31 0 0 0 .5-4.9 31 31 0 0 0-.5-4.9ZM9.7 15.5v-7l6.1 3.5z" /></svg>
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.8 5.8 22H2.6l7.3-8.4L1 2h6.5l4.5 6.7zm-1.1 18h1.7L6.5 3.9H4.7z" /></svg>
}

function HeroMotion() {
  return (
    <section className="homepage-hero" aria-label="WISTA Singapore introduction">
      <div className="homepage-hero-image">
        <div className="homepage-hero-photo-frame">
          <img className="homepage-hero-photo" src={homeHeroBg} alt="WISTA Singapore members gathered at the Singapore Shipping Association anniversary gala" fetchPriority="high" />
        </div>
      </div>
      <svg className="homepage-hero-definitions" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id="homepage-hero-photo-clip" clipPathUnits="objectBoundingBox">
            <path d="M.41 0 C.397 .16 .38 .34 .36 .50 C.344 .66 .356 .84 .39 1 H1 V0 Z" />
          </clipPath>
        </defs>
      </svg>
      <div className="homepage-hero-panel">
        <svg className="homepage-hero-waves" viewBox="0 0 700 220" preserveAspectRatio="none" aria-hidden="true">
          <path d="M-25 157 C95 104 180 200 304 155 S520 106 730 158" />
          <path d="M-25 180 C110 128 196 217 326 179 S536 133 730 184" />
          <path d="M-25 204 C115 157 208 237 338 202 S551 157 730 209" />
        </svg>
        <div className="homepage-hero-copy">
          <p className="homepage-hero-eyebrow">PEOPLE <span>•</span> OPPORTUNITIES <span>•</span> COLLABORATION</p>
          <h1>
            <span>WOMEN</span>
            <span>MOVING</span>
            <span className="homepage-hero-teal">MARITIME</span>
            <span>FORWARD.</span>
          </h1>
          <p className="homepage-hero-lead">Connecting women across Singapore&apos;s<br className="homepage-hero-copy-break" /> maritime, trading and logistics sectors.</p>
          <div className="homepage-hero-actions">
            <Link className="homepage-hero-cta" to="/membership">
              JOIN WISTA <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link className="homepage-hero-network-link" to="/network">
              EXPLORE OUR NETWORK <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <nav className="homepage-hero-memberships" aria-label="Membership applications">
            <Link to="/register/individual" className="homepage-membership-link">
              <UserRound size={19} strokeWidth={1.5} aria-hidden="true" />
              <span><strong>INDIVIDUAL</strong><span>MEMBERSHIP</span></span>
            </Link>
            <Link to="/register/corporate" className="homepage-membership-link">
              <Building2 size={19} strokeWidth={1.5} aria-hidden="true" />
              <span><strong>CORPORATE</strong><span>MEMBERSHIP</span></span>
            </Link>
          </nav>
        </div>
      </div>
      <div className="homepage-hero-socials" role="group" aria-label="WISTA Singapore social media">
        {socialLinks.map(({ platform, label, url }) => {
          const icon = <SocialIcon platform={platform} />
          return url ? (
            <a key={platform} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}>
              {icon}
            </a>
          ) : (
            <span key={platform} className="homepage-hero-social-unconfigured" role="img" aria-label={`${label}; link not configured`}>
              {icon}
            </span>
          )
        })}
      </div>
    </section>
  )
}
export default function Home() {
  const [activePrinciple, setActivePrinciple] = useState(0)
  const [activeLightbox, setActiveLightbox] = useState(null)

  return (
    <main>
      {activeLightbox && (
        <Lightbox 
          src={activeLightbox.src} 
          alt={activeLightbox.alt} 
          caption={activeLightbox.caption} 
          onClose={() => setActiveLightbox(null)} 
        />
      )}

      <div className="homepage-hero-shell">
        <Header cinematic={true} whiteLogo currentPage="HOME" />
        <HeroMotion />
      </div>

      <ScrollReveal>
        <section className="statement section-pad editorial-about">
          <EditorialImage 
            src={homeWelcome} 
            alt="President Yukie Teo addressing WISTA Singapore keynote speech" 
            className="about-photo"
            onClick={() => setActiveLightbox({ src: homeWelcome, alt: 'President Yukie Teo Stage Keynote', caption: 'Yukie Teo — President, WISTA Singapore delivering keynote speech' })}
          />
          <div className="statement-big">
            Singapore&apos;s network connecting <em>women</em> across maritime and trade.
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
