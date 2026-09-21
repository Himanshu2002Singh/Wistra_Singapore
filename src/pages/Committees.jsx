import React, { useState } from 'react'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import DetailLinks from '@/components/editorial/DetailLinks'
import Lightbox from '@/components/ui/Lightbox'
import ScrollReveal from '@/components/ui/ScrollReveal'

// Exclusive Curated Images for Committees
import committeesHeroBg from '../assets/images/wista/hero/committees-hero-bg.jpg'
import committeeYukieProfile from '../assets/images/wista/committees/committee-yukie-profile.jpg'
import committeeBoard from '../assets/images/wista/committees/committee-board.jpg'
import committeeNaval from '../assets/images/wista/committees/committee-naval.jpg'
import committeeCouncil from '../assets/images/wista/committees/committee-council.jpg'

const committeeList = [
  { 
    id: 1, 
    name: 'Yukie Teo', 
    role: 'President, WISTA Singapore', 
    designation: 'Certified Sustainability Practitioner (CSE 2025)', 
    company: 'WISTA Singapore Chapter', 
    bio: 'President of WISTA Singapore leading national initiatives for gender parity, decarbonization, and executive empowerment across maritime, shipping, and trading.', 
    photo: committeeYukieProfile 
  },
  { 
    id: 2, 
    name: 'WISTA Executive Committee', 
    role: 'Executive Leadership Board', 
    designation: 'Board of Directors', 
    company: 'WISTA Singapore', 
    bio: 'Senior leaders driving strategic programs, mentoring, regulatory collaboration, and industry networking across Singapore maritime.', 
    photo: committeeBoard 
  },
  { 
    id: 3, 
    name: 'Maritime Delegation Leaders', 
    role: 'Naval & International Exchange', 
    designation: 'Strategic Partnerships', 
    company: 'WISTA Singapore & Royal Navy', 
    bio: 'Overseeing global cross-border maritime security, naval visits, and international WISTA delegation engagements.', 
    photo: committeeNaval 
  },
  { 
    id: 4, 
    name: 'Industry Advisory Council', 
    role: 'Senior Maritime Advisory', 
    designation: 'Executive Council', 
    company: 'Singapore Shipping Association Partnership', 
    bio: 'Connecting WISTA Singapore with regional port authorities, shipowners, charterers, and maritime legal leaders.', 
    photo: committeeCouncil 
  }
]

export default function Committees() {
  const [activeLightbox, setActiveLightbox] = useState(null)

  return (
    <PageShell currentPage="COMMITTEES">
      {activeLightbox && (
        <Lightbox 
          src={activeLightbox.src} 
          alt={activeLightbox.title} 
          caption={activeLightbox.caption} 
          onClose={() => setActiveLightbox(null)} 
        />
      )}
      <PageIntro 
        eyebrow="06 — COMMITTEES & LEADERSHIP" 
        title={<>Expertise<br /><em>in action.</em></>} 
        lead="Our executive leadership and specialized committees bring specialist knowledge together to create practical progress for our members and the maritime industry."
        bgImage={committeesHeroBg}
        bgPosition="center 30%"
      />
      <section className="route-section content-white space-y-12">
        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {committeeList.map((member) => (
              <div 
                key={member.id} 
                className="bg-[#f5f3ee] border border-[#0b1f33]/10 p-6 rounded-sm flex flex-col sm:flex-row gap-6 items-start shadow-sm hover:border-[#1b9aaa]/50 transition-colors"
              >
                <div className="w-full sm:w-40 aspect-square rounded-sm overflow-hidden bg-[#0b1f33]/10 shrink-0">
                  <img 
                    src={member.photo} 
                    alt={member.name} 
                    loading="lazy"
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setActiveLightbox({ src: member.photo, title: member.name, caption: `${member.role} — ${member.company}` })}
                  />
                </div>
                <div className="space-y-2">
                  <span className="inline-block px-2 py-0.5 bg-[#1b9aaa]/10 text-[#1b9aaa] text-[10px] font-bold tracking-widest uppercase rounded">
                    {member.role}
                  </span>
                  <h3 className="text-xl font-bold font-display text-[#0b1f33]">{member.name}</h3>
                  <p className="text-xs font-semibold text-[#163d5a]">{member.designation}</p>
                  <p className="text-xs text-[#0b1f33]/70 font-medium">{member.company}</p>
                  <p className="text-xs text-[#163d5a]/90 leading-relaxed mt-2">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <h2>Sub-committees &amp; Working <em>Groups.</em></h2>
          <DetailLinks base="/committees" items={[
            'Executive Committee & Officers',
            'Events & Networking Committee',
            'Membership & Community Committee',
            'Communications & Media Committee'
          ]} />
        </ScrollReveal>
      </section>
    </PageShell>
  )
}


