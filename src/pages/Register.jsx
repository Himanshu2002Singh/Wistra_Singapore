import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import { ArrowUpRight, User, Building, ChevronDown } from 'lucide-react'

export default function Register() {
  const [selectedType, setSelectedType] = useState('')
  const navigate = useNavigate()

  const handleDropdownChange = (e) => {
    const val = e.target.value
    setSelectedType(val)
    if (val === 'individual') navigate('/register/individual')
    if (val === 'corporate') navigate('/register/corporate')
  }

  const handleContinue = () => {
    if (selectedType === 'individual') navigate('/register/individual')
    else if (selectedType === 'corporate') navigate('/register/corporate')
  }

  return (
    <PageShell currentPage="REGISTER" lightBg={true}>
      <PageIntro 
        eyebrow="JOIN WISTA SINGAPORE" 
        title={<>Choose your <em>membership.</em></>} 
        lead="Choose your membership type to begin your WISTA Singapore application."
      />

      <section className="route-section content-dark py-16">
        {/* STEP 1: DROPDOWN SELECTOR */}
        <div className="max-w-xl mx-auto mb-16 bg-white/5 p-8 border border-white/10 rounded-lg text-center">
          <p className="text-[10px] font-bold tracking-[.18em] uppercase text-[var(--coral)] mb-2">
            STEP 1
          </p>
          <h3 className="font-[var(--serif)] text-2xl text-white mb-6">
            SELECT YOUR MEMBERSHIP TYPE
          </h3>
          <div className="relative mb-6">
            <select 
              value={selectedType}
              onChange={handleDropdownChange}
              className="w-full px-5 py-4 bg-white/10 border border-white/20 text-white rounded appearance-none focus:border-[var(--teal)] focus:outline-none cursor-pointer pr-10 font-bold tracking-wider text-sm"
            >
              <option value="" disabled className="bg-[var(--ink)] text-gray-300">-- Select Membership Type --</option>
              <option value="individual" className="bg-[var(--ink)] text-white">Individual Membership (SGD 150/yr)</option>
              <option value="corporate" className="bg-[var(--ink)] text-white">Corporate Membership (SGD 500/yr)</option>
            </select>
            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
          </div>

          <button
            onClick={handleContinue}
            disabled={!selectedType}
            className={`w-full py-4 font-bold tracking-widest uppercase text-xs transition flex items-center justify-center gap-2 ${selectedType ? 'bg-[var(--coral)] hover:bg-[#f27663] text-white cursor-pointer' : 'bg-white/10 text-white/40 cursor-not-allowed'}`}
          >
            Continue to Application <ArrowUpRight size={16} />
          </button>
        </div>

        {/* EDITORIAL SELECTION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* INDIVIDUAL CARD */}
          <div className="bg-white/5 border border-white/10 p-8 md:p-10 rounded-lg flex flex-col justify-between hover:border-[var(--coral)] transition group">
            <div>
              <div className="w-12 h-12 rounded-full bg-[var(--coral)]/20 text-[var(--coral)] flex items-center justify-center mb-6">
                <User size={24} />
              </div>
              <p className="text-xs font-bold tracking-widest uppercase text-[var(--coral)] mb-2">FOR PROFESSIONALS</p>
              <h3 className="font-[var(--serif)] text-3xl text-white mb-4">Individual Membership</h3>
              <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                For women working at management/executive levels in maritime, trading, shipping, or logistics in Singapore. Gain full access to local events, mentorship, and the global WISTA International directory.
              </p>
              <div className="text-2xl font-[var(--serif)] text-[var(--teal)] mb-8">
                SGD 150 / year
              </div>
            </div>
            <Link 
              to="/register/individual" 
              className="w-full py-4 bg-[var(--coral)] group-hover:bg-[#f27663] text-white font-bold tracking-widest uppercase text-xs transition flex items-center justify-center gap-2"
            >
              Apply as Individual <ArrowUpRight size={16} />
            </Link>
          </div>

          {/* CORPORATE CARD */}
          <div className="bg-white/5 border border-white/10 p-8 md:p-10 rounded-lg flex flex-col justify-between hover:border-[var(--teal)] transition group">
            <div>
              <div className="w-12 h-12 rounded-full bg-[var(--teal)]/20 text-[var(--teal)] flex items-center justify-center mb-6">
                <Building size={24} />
              </div>
              <p className="text-xs font-bold tracking-widest uppercase text-[var(--teal)] mb-2">FOR ORGANIZATIONS</p>
              <h3 className="font-[var(--serif)] text-3xl text-white mb-4">Corporate Membership</h3>
              <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                For companies in Singapore supporting gender diversity and empowering female leadership. Sponsor multiple female employees for membership and receive brand recognition across WISTA platforms.
              </p>
              <div className="text-2xl font-[var(--serif)] text-[var(--coral)] mb-8">
                SGD 500 / year
              </div>
            </div>
            <Link 
              to="/register/corporate" 
              className="w-full py-4 border border-white group-hover:bg-white group-hover:text-[var(--ink)] text-white font-bold tracking-widest uppercase text-xs transition flex items-center justify-center gap-2"
            >
              Apply as Corporate <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

        {/* WORKFLOW NOTE */}
        <div className="mt-16 text-center text-xs text-white/60 max-w-xl mx-auto border-t border-white/10 pt-6">
          <p>
            <strong>Application Review Process:</strong> Submitted applications are evaluated by the WISTA Singapore Executive Committee (EXCO). Approved applicants will be issued payment instructions.
          </p>
        </div>
      </section>
    </PageShell>
  )
}
