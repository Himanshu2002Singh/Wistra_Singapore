import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import { ArrowUpRight, CheckCircle2, ArrowLeft, Building } from 'lucide-react'

export default function RegisterCorporate() {
  const [formData, setFormData] = useState({
    companyName: '',
    companyDescription: '',
    invoicingContactPerson: '',
    invoicingEmail: '',
    invoicingAddress: '',
    mainContacts: '',
    additionalContacts: '',
    followSocials: false
  })

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
      window.scrollTo(0, 300)
    }, 1000)
  }

  return (
    <PageShell currentPage="CORPORATE APPLICATION">
      <PageIntro 
        eyebrow="MEMBERSHIP APPLICATION" 
        title={<>Corporate <em>Application.</em></>} 
        lead="Sponsor female leaders and support diversity in Singapore's maritime industry. All corporate applications are reviewed by the WISTA Singapore Executive Committee."
      />

      <section className="route-section content-dark py-16 bg-[#0b1f33]">
        <div className="max-w-3xl mx-auto px-4 md:px-0">
          {/* NAVIGATION BACK */}
          <div className="mb-8 flex justify-between items-center text-xs">
            <Link to="/register" className="text-[#5ee5e9] hover:text-white flex items-center gap-1.5 font-semibold tracking-wide transition">
              <ArrowLeft size={14} /> Back to Membership Options
            </Link>
            <span className="text-slate-300 font-medium">WISTA Singapore Chapter</span>
          </div>

          {submitted ? (
            /* SUCCESS CONFIRMATION BANNER */
            <div className="bg-[#0c243b] border border-[#5ee5e9] p-8 md:p-12 rounded-xl text-center animate-fade-in shadow-2xl">
              <CheckCircle2 size={56} className="text-[#5ee5e9] mx-auto mb-6" />
              <h3 className="font-[var(--serif)] text-3xl text-white mb-4">Corporate Application Submitted</h3>
              <p className="text-sm text-slate-200 mb-6 leading-relaxed max-w-lg mx-auto">
                Thank you. The Corporate Membership application for <strong className="text-white font-semibold">{formData.companyName}</strong> has been successfully submitted to the WISTA Singapore Executive Committee (EXCO).
              </p>

              {/* WORKFLOW PIPELINE INDICATOR */}
              <div className="bg-[#071626] p-6 rounded-lg border border-white/15 mb-8 max-w-xl mx-auto text-left text-xs">
                <p className="font-bold uppercase tracking-wider text-[var(--coral)] mb-4">Application Progress</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-white font-medium">
                    <span className="w-5 h-5 rounded-full bg-[#5ee5e9] text-black font-bold flex items-center justify-center text-[10px]">✓</span>
                    <span>Corporate Application Registered</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#5ee5e9] font-bold">
                    <span className="w-5 h-5 rounded-full border border-[#5ee5e9] flex items-center justify-center text-[10px]">2</span>
                    <span>EXCO Review in Progress (Typically 1-2 weeks)</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <span className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center text-[10px]">3</span>
                    <span>Corporate Approval & Invoice Issuance (SGD 500)</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <span className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center text-[10px]">4</span>
                    <span>Nominated Member Onboarding & Portal Access</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Link to="/" className="px-6 py-3 bg-[var(--coral)] hover:bg-[#f27663] text-white font-bold tracking-widest uppercase text-xs rounded transition">
                  Return to Home
                </Link>
              </div>
            </div>
          ) : (
            /* CORPORATE REGISTRATION FORM */
            <form onSubmit={handleSubmit} className="bg-[#0c243b] border border-white/15 p-8 md:p-12 rounded-xl shadow-2xl space-y-10">
              <div className="border-b border-white/15 pb-5">
                <h3 className="font-[var(--serif)] text-3xl text-white font-normal mb-2 tracking-tight">Corporate Membership Application Form</h3>
                <p className="text-xs text-slate-300 font-medium">Fields marked with <span className="text-[#e85d4a] font-bold">*</span> are required.</p>
              </div>

              {/* SECTION 1: COMPANY INFORMATION */}
              <div className="space-y-6">
                <h4 className="text-xs font-bold tracking-widest uppercase text-[#5ee5e9] border-b border-white/15 pb-2.5">
                  01. Organization Details
                </h4>

                <div className="form-group">
                  <label className="text-slate-100 text-xs tracking-wider uppercase font-semibold mb-2 block">
                    Company Name <span className="text-[#e85d4a] font-bold">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="companyName" 
                    required 
                    value={formData.companyName} 
                    onChange={handleChange}
                    placeholder="Full registered company name in Singapore"
                    className="w-full px-4 py-3 bg-[#071626] border border-slate-400/40 text-white rounded-md placeholder:text-slate-400 focus:border-[#5ee5e9] focus:ring-2 focus:ring-[#5ee5e9]/30 focus:outline-none transition duration-150"
                  />
                </div>

                <div className="form-group">
                  <label className="text-slate-100 text-xs tracking-wider uppercase font-semibold mb-2 block">
                    Company Description <span className="text-[#e85d4a] font-bold">*</span>
                  </label>
                  <textarea 
                    name="companyDescription" 
                    required 
                    rows={3}
                    value={formData.companyDescription} 
                    onChange={handleChange}
                    placeholder="Description of your company's core operations, fleet, terminal, or maritime services..."
                    className="w-full px-4 py-3 bg-[#071626] border border-slate-400/40 text-white rounded-md placeholder:text-slate-400 focus:border-[#5ee5e9] focus:ring-2 focus:ring-[#5ee5e9]/30 focus:outline-none transition duration-150"
                  />
                </div>

                <div className="form-group">
                  <label className="text-slate-100 text-xs tracking-wider uppercase font-semibold mb-2 block">
                    Invoicing Address <span className="text-[#e85d4a] font-bold">*</span>
                  </label>
                  <textarea 
                    name="invoicingAddress" 
                    required 
                    rows={3}
                    value={formData.invoicingAddress} 
                    onChange={handleChange}
                    placeholder="Official Singapore corporate billing address..."
                    className="w-full px-4 py-3 bg-[#071626] border border-slate-400/40 text-white rounded-md placeholder:text-slate-400 focus:border-[#5ee5e9] focus:ring-2 focus:ring-[#5ee5e9]/30 focus:outline-none transition duration-150"
                  />
                </div>
              </div>

              {/* SECTION 2: INVOICING CONTACT */}
              <div className="space-y-6">
                <h4 className="text-xs font-bold tracking-widest uppercase text-[#5ee5e9] border-b border-white/15 pb-2.5">
                  02. Billing & Invoicing Contact
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="text-slate-100 text-xs tracking-wider uppercase font-semibold mb-2 block">
                      Contact Person for Invoicing <span className="text-[#e85d4a] font-bold">*</span>
                    </label>
                    <input 
                      type="text" 
                      name="invoicingContactPerson" 
                      required 
                      value={formData.invoicingContactPerson} 
                      onChange={handleChange}
                      placeholder="Name of finance/accounts contact"
                      className="w-full px-4 py-3 bg-[#071626] border border-slate-400/40 text-white rounded-md placeholder:text-slate-400 focus:border-[#5ee5e9] focus:ring-2 focus:ring-[#5ee5e9]/30 focus:outline-none transition duration-150"
                    />
                  </div>

                  <div className="form-group">
                    <label className="text-slate-100 text-xs tracking-wider uppercase font-semibold mb-2 block">
                      Email for Invoicing <span className="text-[#e85d4a] font-bold">*</span>
                    </label>
                    <input 
                      type="email" 
                      name="invoicingEmail" 
                      required 
                      value={formData.invoicingEmail} 
                      onChange={handleChange}
                      placeholder="finance@company.com"
                      className="w-full px-4 py-3 bg-[#071626] border border-slate-400/40 text-white rounded-md placeholder:text-slate-400 focus:border-[#5ee5e9] focus:ring-2 focus:ring-[#5ee5e9]/30 focus:outline-none transition duration-150"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: COMMUNICATIONS & RECIPIENTS */}
              <div className="space-y-6">
                <h4 className="text-xs font-bold tracking-widest uppercase text-[#5ee5e9] border-b border-white/15 pb-2.5">
                  03. WISTA Communication Contacts
                </h4>

                <div className="form-group">
                  <label className="text-slate-100 text-xs tracking-wider uppercase font-semibold mb-2 block">
                    Name, position and email of main contact person(s) for WISTA circulars and communication <span className="text-[#e85d4a] font-bold">*</span>
                  </label>
                  <textarea 
                    name="mainContacts" 
                    required 
                    rows={4}
                    value={formData.mainContacts} 
                    onChange={handleChange}
                    placeholder="e.g. Jane Tan (Managing Director) - jane.tan@company.com"
                    className="w-full px-4 py-3 bg-[#071626] border border-slate-400/40 text-white rounded-md placeholder:text-slate-400 focus:border-[#5ee5e9] focus:ring-2 focus:ring-[#5ee5e9]/30 focus:outline-none transition duration-150"
                  />
                </div>

                <div className="form-group">
                  <label className="text-slate-100 text-xs tracking-wider uppercase font-semibold mb-2 block">
                    Additional email contacts for WISTA circulars (up to 10) <span className="text-slate-300 text-[11px] font-normal lowercase">(optional)</span>
                  </label>
                  <textarea 
                    name="additionalContacts" 
                    rows={3}
                    value={formData.additionalContacts} 
                    onChange={handleChange}
                    placeholder="List additional emails separated by commas..."
                    className="w-full px-4 py-3 bg-[#071626] border border-slate-400/40 text-white rounded-md placeholder:text-slate-400 focus:border-[#5ee5e9] focus:ring-2 focus:ring-[#5ee5e9]/30 focus:outline-none transition duration-150"
                  />
                </div>

                <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-200 font-medium leading-relaxed">
                  <input 
                    type="checkbox" 
                    name="followSocials"
                    checked={formData.followSocials} 
                    onChange={handleChange}
                    className="mt-0.5 rounded accent-[var(--coral)] w-4 h-4"
                  />
                  <span>Follow us on LinkedIn and Instagram for community updates and event announcements.</span>
                </label>
              </div>

              {/* SUBMIT BUTTON */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-[var(--coral)] hover:bg-[#f27663] text-white font-bold tracking-widest uppercase text-xs rounded transition flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? 'Submitting Application...' : <>Submit Corporate Application <ArrowUpRight size={16} /></>}
              </button>
            </form>
          )}
        </div>
      </section>
    </PageShell>
  )
}
