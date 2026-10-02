import React, { useState } from 'react'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import EditorialImage from '@/components/editorial/EditorialImage'
import ArrowLink from '@/components/editorial/ArrowLink'
import Lightbox from '@/components/ui/Lightbox'
import ScrollReveal from '@/components/ui/ScrollReveal'

// Exclusive Curated Images for About
import aboutHeroBg from '../assets/images/wista/client-provided/wista-leadership-group.jpg'
import aboutPresidentQuote from '../assets/images/wista/client-provided/wista-president-yukie-teo.png'
import aboutCommunity from '../assets/images/wista/client-provided/wista-community-gathering.jpg'

export default function About() {
  const [activeLightbox, setActiveLightbox] = useState(null)

  return (
    <PageShell currentPage="ABOUT">
      {activeLightbox && (
        <Lightbox 
          src={activeLightbox.src} 
          alt={activeLightbox.alt} 
          caption={activeLightbox.caption} 
          onClose={() => setActiveLightbox(null)} 
        />
      )}
      <PageIntro 
        eyebrow="01 — ABOUT WISTA SINGAPORE" 
        title={<>WHO<br />WE<br /><em>ARE</em></>}
        lead="WISTA Singapore is a networking organization for women at the management level in the maritime, trading and logistics sectors."
        bgImage={aboutHeroBg}
        bgPosition="center 20%"
        variant="curve-right"
      />
      <section className="about-message-section content-white">
        <ScrollReveal>
          <div className="about-message-layout">
            <EditorialImage
              src={aboutPresidentQuote}
              alt="President Yukie Teo portrait"
              className="about-president-portrait"
              onClick={() => setActiveLightbox({ src: aboutPresidentQuote, alt: 'President Yukie Teo', caption: 'Yukie Teo — President, WISTA Singapore' })}
            />
            <div className="about-message-copy">
              <p className="eyebrow">LEADERSHIP &amp; VISION</p>
              <h2>President&apos;s Message</h2>
              <blockquote>
                <p>"WISTA Singapore provides a vital platform for professional women across shipping, commodity trading, and port operations. Our mission is to amplify female voices, foster executive mentorship, and drive sustainability standardisation across maritime supply chains."</p>
              </blockquote>
              <p className="about-president-name">YUKIE TEO — PRESIDENT, WISTA SINGAPORE</p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <section className="route-section content-white about-editorial-content">
        <ScrollReveal>
          <div className="about-editorial-opening">
            <div className="about-editorial-heading">
              <p className="eyebrow">WISTA SINGAPORE</p>
              <h2>A network built on <em>connection.</em></h2>
            </div>
            <EditorialImage
              src={aboutCommunity}
              alt="WISTA Singapore members gathered together"
              className="about-community-image"
              onClick={() => setActiveLightbox({ src: aboutCommunity, alt: 'WISTA Singapore members gathered together', caption: 'WISTA Singapore Community' })}
            />
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="about-principles">
            {[
              ["OUR PURPOSE", "We create a place for women to connect, learn and lead across Singapore's maritime world."],
              ["OUR MISSION", "Empowering women through networking, education and advocacy in Singapore's shipping, trading and logistics ecosystem."],
              ["OUR FUTURE", "We work toward a more diverse, inclusive and resilient maritime industry for generations to come."]
            ].map(([title, text], index) => (
              <article className="about-principle" key={title}>
                <span className="about-principle-number">0{index + 1}</span>
                <div className="about-principle-copy">
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <ArrowLink href="#">Explore story</ArrowLink>
                </div>
              </article>
            ))}
          </div>
        </ScrollReveal>
      </section>

    </PageShell>
  )
}
