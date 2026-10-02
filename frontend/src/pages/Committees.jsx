import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import DetailLinks from '@/components/editorial/DetailLinks'
import ScrollReveal from '@/components/ui/ScrollReveal'

// Exclusive Curated Hero Image for Committees
import committeesHeroBg from '../assets/images/wista/client-provided/wista-ambassadors-committee.jpg'
import yukiePortrait from '../assets/images/wista/client-provided/wista-president-yukie-teo.png'
import prantikaPortrait from '../assets/images/wista/client-provided/wista-prantika-sengupta.png'
import amandaPortrait from '../assets/images/wista/client-provided/wista-amanda-hastings.png'

const executiveCommittee = [
  {
    number: '01',
    name: 'Yukie Teo',
    role: 'WISTA Singapore President',
    title: 'Founder',
    company: 'Kie Solutions Pte Ltd',
    photo: yukiePortrait,
    layout: 'yukie'
  },
  {
    number: '02',
    name: 'Prantika Sengupta',
    role: 'WISTA Singapore Vice President',
    title: 'Director of Marine Claims & Client Relations',
    company: 'Tysers Singapore',
    photo: prantikaPortrait,
    layout: 'prantika'
  },
  {
    number: '03',
    name: 'Amanda Hastings',
    role: 'WISTA Singapore ExCo Member',
    title: 'Head of Claims, APA',
    company: 'Maersk',
    photo: amandaPortrait,
    layout: 'amanda'
  }
]

function ExecutiveProfile({ member }) {
  return (
    <article className={`exco-profile exco-profile--${member.layout}`}>
      <div className="exco-profile-index">
        <span>{member.number}</span>
        <span>Executive Committee</span>
      </div>
      <figure className="exco-portrait" aria-label={`${member.name} portrait slot`}>
        {member.photo ? (
          <img src={member.photo} alt={member.name} loading="lazy" />
        ) : (
          <div className="exco-portrait-placeholder">
            <span className="exco-placeholder-mark" aria-hidden="true">+</span>
            <span>Portrait to be provided</span>
          </div>
        )}
      </figure>
      <div className="exco-profile-copy">
        <h3>{member.name}</h3>
        <p className="exco-role">{member.role}</p>
        <p className="exco-title">{member.title}</p>
        <p className="exco-company">{member.company}</p>
      </div>
    </article>
  )
}

export default function Committees() {

  return (
    <PageShell currentPage="COMMITTEES">
      <PageIntro 
        eyebrow="06 — COMMITTEES & LEADERSHIP" 
        title={<>LEADERSHIP<br /><em>&amp; COMMUNITY</em></>}
        lead="Our executive leadership and specialized committees bring specialist knowledge together to create practical progress for our members and the maritime industry."
        bgImage={committeesHeroBg}
        bgPosition="center 30%"
        variant="curve-right"
      />
      <section className="exco-leadership-section">
        <ScrollReveal>
          <div className="exco-section-inner">
            <header className="exco-section-heading">
              <p className="eyebrow">EXECUTIVE COMMITTEE</p>
              <div>
                <h2>The people behind<br /><em>WISTA Singapore.</em></h2>
                <p>Meet the leaders helping build connections, collaboration and opportunities across WISTA Singapore.</p>
              </div>
            </header>
            <div className="exco-profiles">
              {executiveCommittee.map((member) => <ExecutiveProfile key={member.number} member={member} />)}
            </div>
          </div>
        </ScrollReveal>
      </section>

      <section className="route-section content-white committee-working-groups">
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
