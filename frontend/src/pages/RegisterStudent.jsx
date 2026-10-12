import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import studentHero from '../assets/images/wista/membership/membership-reception.jpg'

export default function RegisterStudent() {
  return (
    <PageShell currentPage="STUDENT MEMBERSHIP">
      <PageIntro
        eyebrow="MEMBERSHIP APPLICATION"
        title={<>Student <em>Membership.</em></>}
        lead="Student membership registration information."
        bgImage={studentHero}
        variant="form"
      />

      <section className="route-section registration-form-section py-16">
        <div className="max-w-3xl mx-auto px-4 md:px-0">
          <div className="bg-[#0c243b] border border-white/15 p-8 md:p-12 rounded-xl shadow-2xl">
            <p className="text-xs font-bold tracking-[.16em] uppercase text-[#5ee5e9] mb-3">Application details required</p>
            <h2 className="font-[var(--serif)] text-3xl text-white font-normal mb-4">Client information needed before applications can be submitted</h2>
            <p className="text-sm text-slate-200 leading-relaxed">
              WISTA Singapore has not provided a student registration form or confirmed the application requirements. No student application can be submitted from this page until those details are supplied.
            </p>
            <p className="mt-5 text-xs text-slate-300 leading-relaxed">
              To complete the Student flow, the client needs to provide the official form and confirm the required fields, eligibility criteria, fees, and application review process. The existing registration service currently accepts Individual and Corporate applications only.
            </p>
            <Link to="/register" className="mt-8 inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-[#5ee5e9] hover:text-white">
              <ArrowLeft size={14} aria-hidden="true" /> Back to Membership Options
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
