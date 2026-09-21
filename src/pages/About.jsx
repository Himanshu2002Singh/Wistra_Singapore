import React, { useState } from 'react'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import CardGrid from '@/components/editorial/CardGrid'
import EditorialImage from '@/components/editorial/EditorialImage'
import Lightbox from '@/components/ui/Lightbox'
import ScrollReveal from '@/components/ui/ScrollReveal'

// Exclusive Curated Images for About
import aboutHeroBg from '../assets/images/wista/hero/about-hero-bg.jpg'
import aboutPresidentQuote from '../assets/images/wista/about/about-president-quote.jpg'
import aboutStory from '../assets/images/wista/about/about-story.jpg'
import aboutOperations from '../assets/images/wista/about/about-operations.jpg'

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
        title={<>Women moving <em>maritime</em> forward.</>} 
        lead="WISTA Singapore is a networking organization for women at the management level in the maritime, trading and logistics sectors."
        bgImage={aboutHeroBg}
        bgPosition="center 20%"
      />
      <section className="route-section content-white space-y-12">
        <ScrollReveal>
          <h2>A network built on <em>connection.</em></h2>
          <CardGrid items={[
            ["OUR PURPOSE", "We create a place for women to connect, learn and lead across Singapore's maritime world."],
            ["OUR MISSION", "Empowering women through networking, education and advocacy in Singapore's shipping, trading and logistics ecosystem."],
            ["OUR FUTURE", "We work toward a more diverse, inclusive and resilient maritime industry for generations to come."]
          ]} />
        </ScrollReveal>

        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center my-12 pt-8 border-t border-[#0b1f33]/10">
            <EditorialImage 
              src={aboutPresidentQuote} 
              alt="President Yukie Teo portrait" 
              className="rounded-sm shadow-md"
              onClick={() => setActiveLightbox({ src: aboutPresidentQuote, alt: 'President Yukie Teo', caption: 'Yukie Teo — President, WISTA Singapore' })}
            />
            <div className="space-y-4">
              <p className="eyebrow text-[#1b9aaa]">LEADERSHIP &amp; VISION</p>
              <h3 className="text-2xl md:text-3xl font-bold text-[#0b1f33] font-display">President's Message</h3>
              <p className="text-[#163d5a] text-sm md:text-base leading-relaxed">
                "WISTA Singapore provides a vital platform for professional women across shipping, commodity trading, and port operations. Our mission is to amplify female voices, foster executive mentorship, and drive sustainability standardisation across maritime supply chains."
              </p>
              <p className="text-xs font-semibold tracking-wider text-[#0b1f33]">
                YUKIE TEO — PRESIDENT, WISTA SINGAPORE
              </p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
            <EditorialImage 
              src={aboutStory} 
              alt="WISTA Singapore female leaders community" 
              onClick={() => setActiveLightbox({ src: aboutStory, alt: 'Community Engagement', caption: 'WISTA Singapore Executive Community' })}
            />
            <EditorialImage 
              src={aboutOperations} 
              alt="Vessel deck officer briefing" 
              onClick={() => setActiveLightbox({ src: aboutOperations, alt: 'Maritime Operations Briefing', caption: 'Naval Vessel Briefing & Operational Exchange' })}
            />
          </div>
        </ScrollReveal>
      </section>
    </PageShell>
  )
}


