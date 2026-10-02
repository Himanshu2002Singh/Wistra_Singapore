import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import EditorialImage from '@/components/editorial/EditorialImage'
import Lightbox from '@/components/ui/Lightbox'
import WorkflowJourney from '@/components/ui/WorkflowJourney'
import ScrollReveal from '@/components/ui/ScrollReveal'

// Exclusive Curated Images for Membership
import membershipHeroBg from '../assets/images/wista/client-provided/wista-member-group-close.jpg'
import membershipCommunity from '../assets/images/wista/client-provided/wista-membership-community-visit.jpg'
import membershipCorporate from '../assets/images/wista/client-provided/wista-corporate-membership.jpeg'
import membershipMentoring from '../assets/images/wista/membership/membership-mentoring.jpg'
import membershipReception from '../assets/images/wista/membership/membership-reception.jpg'

export default function Membership() {
  const [activeLightbox, setActiveLightbox] = useState(null)

  return (
    <PageShell currentPage="MEMBERSHIP">
      {activeLightbox && (
        <Lightbox 
          src={activeLightbox.src} 
          alt={activeLightbox.alt} 
          caption={activeLightbox.caption} 
          onClose={() => setActiveLightbox(null)} 
        />
      )}
      <PageIntro 
        eyebrow="02 — MEMBERSHIP"
        title={<>JOIN<br /><em>WISTA</em></>}
        lead="Join a vibrant community of professionals who believe Singapore's maritime industry moves forward when everyone has a voice."
        bgImage={membershipHeroBg}
        bgPosition="center 30%"
        variant="sweep"
      />
      
      <section className="route-section content-white membership-editorial">
        <ScrollReveal>
          <div className="membership-story">
            <div className="membership-story-copy">
              <h2>More than a<br /><em>membership.</em></h2>
              <div className="membership-chapters">
                {[
                  ["CONNECT", "Build meaningful relationships across companies and maritime sectors in Singapore."],
                  ["GROW", "Learn through mentorship, workshops, and shared industry expertise."],
                  ["LEAD", "Shape a more inclusive future for women in maritime."]
                ].map(([title, text], index) => (
                  <article className="membership-chapter" key={title}>
                    <span className="membership-chapter-number">0{index + 1}</span>
                    <div>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <EditorialImage
              src={membershipCommunity}
              alt="WISTA Singapore members at a community gathering"
              className="membership-community-image"
              onClick={() => setActiveLightbox({ src: membershipCommunity, alt: 'WISTA Singapore members at a community gathering', caption: 'WISTA Singapore Member Community' })}
            />
          </div>
        </ScrollReveal>
      </section>

      <section className="membership-journey-section content-white">
        <ScrollReveal delay={1}>
          <WorkflowJourney />
        </ScrollReveal>
      </section>

      <section className="route-section content-white membership-options-section space-y-12">
        <ScrollReveal>
          <div className="membership-paths">
            <article className="membership-path">
              <EditorialImage
                src={membershipMentoring}
                alt="WISTA members sharing a mentoring conversation"
                onClick={() => setActiveLightbox({ src: membershipMentoring, alt: 'Mentorship Exchange', caption: 'Peer Exchange & Global Mentorship' })}
              />
              <div className="membership-path-copy">
                <p className="eyebrow">INDIVIDUAL MEMBERSHIP</p>
                <h3>For professionals</h3>
                <p>For women working at management and executive levels across Singapore&apos;s maritime, trading, shipping and logistics sectors.</p>
                <Link className="editorial-link" to="/register/individual">Explore individual membership <span aria-hidden="true">↗</span></Link>
              </div>
            </article>
            <article className="membership-path membership-path--reverse">
              <EditorialImage
                src={membershipCorporate}
                alt="WISTA Singapore member welcoming visitors at a corporate event"
                onClick={() => setActiveLightbox({ src: membershipCorporate, alt: 'WISTA Singapore member welcoming visitors at a corporate event', caption: 'Corporate Membership & Industry Connections' })}
              />
              <div className="membership-path-copy">
                <p className="eyebrow">CORPORATE MEMBERSHIP</p>
                <h3>For organizations</h3>
                <p>For companies in Singapore supporting gender diversity and empowering female leadership.</p>
                <Link className="editorial-link" to="/register/corporate">Explore corporate membership <span aria-hidden="true">↗</span></Link>
              </div>
            </article>
          </div>
        </ScrollReveal>

      </section>
    </PageShell>
  )
}
