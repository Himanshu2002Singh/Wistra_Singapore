import React, { useState } from 'react'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import { submitContactMessageApi } from '@/services/contactService'

// Exclusive Curated Background Image for Contact
import contactHeroBg from '../assets/images/wista/client-provided/wista-networking-dinner.jpg'

export default function Contact() {
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    setNotice(null)
    const form = event.currentTarget
    const formData = new FormData(form)
    try {
      const result = await submitContactMessageApi({
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message'),
      })
      setNotice({ type: 'success', message: result.message || 'Your message has been recorded.' })
      form.reset()
    } catch (error) {
      setNotice({ type: 'error', message: error.response?.data?.message || 'We could not record your message. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell currentPage="CONTACT">
      <PageIntro 
        eyebrow="08 — CONTACT" 
        title={<>Let&apos;s<br /><em>connect.</em></>} 
        lead="Have a question about WISTA Singapore, membership or collaboration? We would love to hear from you."
        bgImage={contactHeroBg}
        bgPosition="center 30%"
        variant="sweep"
      />
      <section className="route-section content-white contact-editorial">
        <div className="contact-layout">
          <div className="contact-copy">
            <h2>Start a<br /><em>conversation.</em></h2>
            <p className="page-lead">For general enquiries, partnerships and membership questions, send us a note.</p>
            <address className="contact-office">
              <span className="eyebrow">WISTA SINGAPORE OFFICE</span>
              <span>8 Burn Road, #15-05 Trivex</span>
              <span>Singapore 369977</span>
            </address>
          </div>
          <form className="contact-form" onSubmit={handleSubmit}>
            {notice && <p role={notice.type === 'error' ? 'alert' : 'status'} className={notice.type === 'error' ? 'text-sm text-red-700' : 'text-sm text-emerald-800'}>{notice.message}</p>}
            <label>
              Name
              <input required name="name" maxLength={100} disabled={loading} />
            </label>
            <label>
              Email
              <input required type="email" name="email" maxLength={255} disabled={loading} />
            </label>
            <label>
              Message
              <textarea required name="message" rows={5} maxLength={5000} disabled={loading} />
            </label>
            <button className="editorial-link" type="submit" disabled={loading}>{loading ? 'Recording…' : 'Send message ↗'}</button>
          </form>
        </div>
      </section>
    </PageShell>
  )
}
