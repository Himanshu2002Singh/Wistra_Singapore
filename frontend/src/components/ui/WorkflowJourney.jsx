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
    <div className="workflow-journey-wrapper">
      <div className="workflow-journey-heading">
        <p className="workflow-journey-label">MEMBER JOURNEY</p>
        <h2>How membership works.</h2>
      </div>
      <ol className="workflow-journey">
        {steps.map((s, idx) => (
          <li key={s.num}>
            <button
              type="button"
              className={`workflow-step ${activeStep === idx ? 'active' : ''}`}
              aria-pressed={activeStep === idx}
              onClick={() => setActiveStep(idx)}
              onMouseEnter={() => setActiveStep(idx)}
              onFocus={() => setActiveStep(idx)}
            >
              <span className="workflow-step-node" aria-hidden="true" />
              <span className="workflow-step-num">{s.num}</span>
              <span className="workflow-step-title">{s.title}</span>
              <span className="workflow-step-desc">{s.desc}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
