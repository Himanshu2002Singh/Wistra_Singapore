import React, { useState } from 'react'

const steps = [
  { num: '01', title: 'APPLICATION SUBMITTED', desc: 'Prospective member completes individual or corporate form.' },
  { num: '02', title: 'EXCO REVIEW', desc: 'WISTA Singapore Executive Committee evaluates eligibility.' },
  { num: '03', title: 'APPROVAL NOTIFICATION', desc: 'Approved applicant receives official welcome letter.' },
  { num: '04', title: 'PAYMENT REQUESTED', desc: 'Secure payment details issued for annual dues.' },
  { num: '05', title: 'MEMBERSHIP ACTIVATION', desc: 'Access granted to member portal, events, and global network.' }
]

export default function WorkflowJourney() {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <div className="workflow-journey-wrapper my-12">
      <h3 className="text-[11px] font-bold tracking-[.18em] uppercase text-[var(--coral)] mb-2">
        MEMBER JOURNEY
      </h3>
      <h4 className="font-[var(--serif)] text-3xl text-white mb-6">
        How membership works.
      </h4>
      <div className="workflow-journey">
        {steps.map((s, idx) => (
          <div 
            key={s.num} 
            className={`workflow-step ${activeStep === idx ? 'active' : ''}`}
            onClick={() => setActiveStep(idx)}
            onMouseEnter={() => setActiveStep(idx)}
          >
            <div className="workflow-step-num">{s.num}</div>
            <div className="workflow-step-title">{s.title}</div>
            <div className="workflow-step-desc">{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
