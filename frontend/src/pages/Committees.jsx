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
        title={<>LEADERSHIP<br /><em>&amp; COMMUNITY</em></>}
        lead="Our executive leadership and specialized committees bring specialist knowledge together to create practical progress for our members and the maritime industry."
        bgImage={committeesHeroBg}
        bgPosition="center 30%"
        variant="curve-right"
      />
      <section className="route-section content-white space-y-12">
        <ScrollReveal>
          <div className="committee-editorial-list">
            {committeeList[0] && (
              <article className="committee-featured-profile">
                <div className="committee-featured-image">
                  <img src={committeeList[0].photo} alt={committeeList[0].name} onClick={() => setActiveLightbox({ src: committeeList[0].photo, title: committeeList[0].name, caption: `${committeeList[0].role} — ${committeeList[0].company}` })} />
                </div>
                <div className="committee-profile-copy">
                  <p className="eyebrow">{committeeList[0].role}</p>
                  <h2>{committeeList[0].name}</h2>
                  <p className="committee-designation">{committeeList[0].designation}</p>
                  <p className="committee-company">{committeeList[0].company}</p>
                  <p>{committeeList[0].bio}</p>
                </div>
              </article>
            )}
            <div className="committee-supporting-profiles">
              {committeeList.slice(1).map((member) => (
                <article key={member.id} className="committee-supporting-profile">
                  <div className="committee-supporting-image">
                    <img src={member.photo} alt={member.name} loading="lazy" onClick={() => setActiveLightbox({ src: member.photo, title: member.name, caption: `${member.role} — ${member.company}` })} />
                  </div>
                  <div className="committee-profile-copy">
                    <p className="eyebrow">{member.role}</p>
                    <h3>{member.name}</h3>
                    <p className="committee-designation">{member.designation}</p>
                    <p className="committee-company">{member.company}</p>
                    <p>{member.bio}</p>
                  </div>
                </article>
              ))}
            </div>
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
