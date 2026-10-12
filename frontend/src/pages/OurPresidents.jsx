import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import ScrollReveal from '@/components/ui/ScrollReveal'
import presidentsHero from '../assets/images/wista/hero/about-hero-bg.jpg'
import yukiePortrait from '../assets/images/wista/client-provided/wista-president-yukie-teo.png'
import prantikaPortrait from '../assets/images/wista/client-provided/wista-prantika-sengupta.png'
import amandaPortrait from '../assets/images/wista/client-provided/wista-amanda-hastings.png'

const presidents = [
  {
    number: '01',
    name: 'Yukie Teo',
    role: 'WISTA Singapore President',
    title: 'Founder',
    company: 'Kie Solutions Pte Ltd',
    photo: yukiePortrait,
  },
  {
    number: '02',
    name: 'Prantika Sengupta',
    role: 'WISTA Singapore Vice President',
    title: 'Director of Marine Claims & Client Relations',
    company: 'Tysers Singapore',
    photo: prantikaPortrait,
  },
  {
    number: '03',
    name: 'Amanda Hastings',
    role: 'WISTA Singapore ExCo Member',
    title: 'Head of Claims, APA',
    company: 'Maersk',
    photo: amandaPortrait,
  },
]

export default function OurPresidents() {
  return (
    <PageShell currentPage="OUR PRESIDENTS">
      <PageIntro
        eyebrow="WISTA SINGAPORE — LEADERSHIP ARCHIVE"
        title={<>Our <em>Presidents.</em></>}
        lead="A record of the leaders who have served as President of WISTA Singapore."
        bgImage={presidentsHero}
        bgPosition="center 25%"
        variant="curve-right"
      />

      <div className="president-archive-list">
        {presidents.map((president, index) => (
          <ScrollReveal key={president.name}>
            <section className={`president-profile-section ${index % 2 ? 'president-profile-section--reverse' : ''}`} aria-labelledby={`president-${president.number}`}>
              <article className="president-profile">
                <div className="president-profile-portrait-wrap">
                  <img
                    src={president.photo}
                    alt={president.name}
                    className="president-profile-portrait"
                    loading="lazy"
                  />
                </div>
                <div className="president-profile-copy">
                  <p className="president-profile-index">{president.number} <span>/</span> WISTA SINGAPORE</p>
                  <p className="eyebrow">LEADERSHIP</p>
                  <h2 id={`president-${president.number}`}>{president.name}</h2>
                  <p className="president-profile-role">{president.role}</p>
                  <div className="president-profile-rule" aria-hidden="true" />
                  <p className="president-profile-title">{president.title}</p>
                  <p className="president-profile-company">{president.company}</p>
                </div>
              </article>
            </section>
          </ScrollReveal>
        ))}
      </div>

    </PageShell>
  )
}
