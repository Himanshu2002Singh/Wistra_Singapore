import React from 'react'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'

// Exclusive Curated Background Image for Contact
import contactHeroBg from '../assets/images/wista/hero/contact-hero-bg.jpg'

export default function Contact() {
  return (
    <PageShell currentPage="CONTACT">
      <PageIntro 
        eyebrow="08 — CONTACT" 
        title={<>Let&apos;s<br /><em>connect.</em></>} 
        lead="Have a question about WISTA Singapore, membership or collaboration? We would love to hear from you."
        bgImage={contactHeroBg}
        bgPosition="center 30%"
      />
      <section className="route-section content-dark">
        <div className="contact-layout">
          <div>
            <h2>Start a<br /><em>conversation.</em></h2>
            <p className="page-lead">For general enquiries, partnerships and membership questions, send us a note.</p>
          </div>
          <form className="contact-form" onSubmit={(e) => { e.preventDefault(); alert('Message sent!'); }}>
            <label>
              Name
              <input required name="name" />
            </label>
            <label>
              Email
              <input required type="email" name="email" />
            </label>
            <label>
              Message
              <textarea required name="message" rows={5} />
            </label>
            <button className="editorial-link" type="submit">Send message ↗</button>
          </form>
        </div>
      </section>
    </PageShell>
  )
}

