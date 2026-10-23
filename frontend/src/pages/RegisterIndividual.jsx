import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import { ArrowUpRight, CheckCircle2, ArrowLeft, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { submitApplicationApi } from '@/services/membershipService'
import individualHeroBg from '../assets/images/wista/membership/membership-mentoring.jpg'

const getSubmissionError = (error) => {
  const status = error.response?.status
  const details = Object.values(error.response?.data?.errors || {}).filter((value) => typeof value === 'string')
  if (details.length) return details.join(' ')
  if (status === 401) return 'Your session has expired. Sign in again, then resubmit your application.'
  if (status === 403) return 'Membership applications must be submitted with a Member applicant account. Sign out of the administrator account and continue with a Member account.'
  if (status === 409) return error.response?.data?.message || 'An application is already in progress for this account.'
  if (status >= 500) return 'The registration service is temporarily unavailable. Please try again later.'
  if (!error.response && error.message && error.message !== 'Network Error' && !error.message.startsWith('Request failed with status code')) return error.message
  if (!error.response) return 'Could not reach the registration service. Check your connection and try again.'
  return error.response?.data?.message || 'Please check your details and try again.'
}

export default function RegisterIndividual() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    mobileNumber: '',
    designation: '',
    companyName: '',
    companyDescription: '',
    invoicingAddress: '',
    nationality: '',
    dateOfBirth: '',
    followSocials: false
  })

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedApp, setSubmittedApp] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { isAuthenticated, isDemo, user, register, login, logout } = useAuth()
  const roleName = user?.role?.name || user?.role_name || user?.role
  const hasMemberSession = isAuthenticated && !isDemo && roleName === 'MEMBER'
  const hasWrongRoleSession = isAuthenticated && !hasMemberSession

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (hasWrongRoleSession) {
      setErrorMessage('This application must be linked to a Member account. Sign out of the administrator account, then continue with a Member account.')
      return
    }
    setErrorMessage('')
    setLoading(true)

    try {
      // Step 1: Create user account or authenticate if not logged in
      if (!isAuthenticated) {
        let applicantUser
        try {
          const registration = await register({
            email: formData.email,
            password: formData.password,
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.mobileNumber,
          })
          applicantUser = registration?.data?.user
        } catch (regErr) {
          if (regErr.response?.status === 409) {
            applicantUser = await login(formData.email, formData.password)
          } else {
            throw regErr
          }
        }

        const applicantRole = applicantUser?.role?.name || applicantUser?.role_name || applicantUser?.role
        if (applicantRole !== 'MEMBER') {
          throw new Error('That email belongs to a non-member account. Sign in with or create a Member applicant account to submit this application.')
        }
      }

      // Step 2: Submit Individual Membership Application
      const appRes = await submitApplicationApi({
        membership_type: 'INDIVIDUAL',
        company: formData.companyName,
        designation: formData.designation,
        biography: formData.companyDescription,
        invoicing_address: formData.invoicingAddress,
        nationality: formData.nationality || null,
        date_of_birth: formData.dateOfBirth || null,
        phone: formData.mobileNumber,
      })

      if (appRes && appRes.success && appRes.data) {
        setSubmittedApp(appRes.data)
        setLoading(false)
        setSubmitted(true)
        window.scrollTo(0, 300)
      } else {
        throw new Error(appRes.message || 'Application submission failed.')
      }
    } catch (err) {
      setLoading(false)
      setErrorMessage(getSubmissionError(err))
    }
  }

  return (
    <PageShell currentPage="INDIVIDUAL APPLICATION">
      <PageIntro
        eyebrow="MEMBERSHIP APPLICATION"
        title={<>Individual <em>Application.</em></>}
        lead="Complete the application form below. All applications are reviewed by the WISTA Singapore Executive Committee."
        bgImage={individualHeroBg}
        variant="form"
      />

      <section className="route-section registration-form-section py-16">
        <div className="max-w-3xl mx-auto px-4 md:px-0">
          {/* NAVIGATION BACK */}
          <div className="mb-8 flex justify-between items-center text-xs">
            <Link to="/register" className="application-back-link text-[#5ee5e9] hover:text-white flex items-center gap-1.5 font-semibold tracking-wide transition">
              <ArrowLeft size={14} /> Back to Membership Options
            </Link>
            <span className="text-slate-300 font-medium">WISTA Singapore Chapter</span>
          </div>

          {submitted ? (
            /* SUCCESS CONFIRMATION BANNER */
            <div className="bg-[#0c243b] border border-[#5ee5e9] p-8 md:p-12 rounded-xl text-center animate-fade-in shadow-2xl">
              <CheckCircle2 size={56} className="text-[#5ee5e9] mx-auto mb-6" />
              <h3 className="font-[var(--serif)] text-3xl text-white mb-4">Application Submitted</h3>
              <p className="text-sm text-slate-200 mb-2 leading-relaxed max-w-lg mx-auto">
                Thank you, <strong className="text-white font-semibold">{formData.firstName} {formData.lastName}</strong>. Your Individual Membership application for <strong className="text-white font-semibold">{formData.companyName}</strong> has been successfully submitted to the WISTA Singapore Executive Committee (EXCO).
              </p>
              {submittedApp && (
                <div className="inline-block bg-[#5ee5e9]/10 border border-[#5ee5e9]/40 px-4 py-2 rounded text-[#5ee5e9] text-xs font-mono font-bold mb-6">
                  Application #: {submittedApp.application_number}
                </div>
              )}

              {/* WORKFLOW PIPELINE INDICATOR */}
              <div className="bg-[#071626] p-6 rounded-lg border border-white/15 mb-8 max-w-xl mx-auto text-left text-xs">
                <p className="font-bold uppercase tracking-wider text-[var(--coral)] mb-4">Application Progress</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-white font-medium">
                    <span className="w-5 h-5 rounded-full bg-[#5ee5e9] text-black font-bold flex items-center justify-center text-[10px]">✓</span>
                    <span>Application Registered ({submittedApp?.application_number || 'PENDING'})</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#5ee5e9] font-bold">
                    <span className="w-5 h-5 rounded-full border border-[#5ee5e9] flex items-center justify-center text-[10px]">2</span>
                    <span>EXCO Review in Progress (Typically 1-2 weeks)</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <span className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center text-[10px]">3</span>
                    <span>Approval & Invoice Issuance (SGD 150)</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <span className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center text-[10px]">4</span>
                    <span>Membership Activation & Portal Access</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Link to="/" className="px-6 py-3 bg-[var(--coral)] hover:bg-[#f27663] text-white font-bold tracking-widest uppercase text-xs rounded transition">
                  Return to Home
                </Link>
                <Link to="/member" className="application-login-link px-6 py-3 border border-white font-bold tracking-widest uppercase text-xs rounded transition">
                  Go to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            /* INDIVIDUAL REGISTRATION FORM */
            <form onSubmit={handleSubmit} className="public-application-form bg-[#0c243b] border border-white/15 p-8 md:p-12 rounded-xl shadow-2xl space-y-10">
              <div className="border-b border-white/15 pb-5">
                <h3 className="font-[var(--serif)] text-3xl text-white font-normal mb-2 tracking-tight">Individual Membership Application Form</h3>
                <p className="text-xs text-slate-300 font-medium">Fields marked with <span className="text-[#e85d4a] font-bold">*</span> are required.</p>
              </div>

              {errorMessage && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {hasWrongRoleSession && (
                <div className="flex flex-col gap-3 rounded border border-[#e3bd66] bg-[#fff8e7] p-4 text-xs leading-relaxed text-[#553f13] sm:flex-row sm:items-center sm:justify-between" role="status">
                  <span>You are signed in as {roleName === 'SUPER_ADMIN' || (typeof roleName === 'string' && roleName.endsWith('_ADMIN')) ? 'an administrator' : 'a non-member account'}. Membership applications require a Member account.</span>
                  <button type="button" onClick={logout} className="shrink-0 font-bold text-[#0f2d52] underline underline-offset-2 hover:text-[#087f8c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f2d52]">Sign out to continue</button>
                </div>
              )}

              {/* SECTION 1: PERSONAL DETAILS */}
              <div className="space-y-6">
                <h4 className="text-xs font-bold tracking-widest uppercase text-[#5ee5e9] border-b border-white/15 pb-2.5">
                  01. Personal Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="text-slate-100 text-xs tracking-wider uppercase font-semibold mb-2 block">
                      First Name <span className="text-[#e85d4a] font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Jane"
                      className="w-full px-4 py-3 bg-[#071626] border border-slate-400/40 text-white rounded-md placeholder:text-slate-400 focus:border-[#5ee5e9] focus:ring-2 focus:ring-[#5ee5e9]/30 focus:outline-none transition duration-150"
                    />
                  </div>

                  <div className="form-group">
                    <label className="text-slate-100 text-xs tracking-wider uppercase font-semibold mb-2 block">
                      Last Name <span className="text-[#e85d4a] font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Doe"
                      className="w-full px-4 py-3 bg-[#071626] border border-slate-400/40 text-white rounded-md placeholder:text-slate-400 focus:border-[#5ee5e9] focus:ring-2 focus:ring-[#5ee5e9]/30 focus:outline-none transition duration-150"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="text-slate-100 text-xs tracking-wider uppercase font-semibold mb-2 block">
                      Email Address <span className="text-[#e85d4a] font-bold">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="jane.doe@company.com"
                      className="w-full px-4 py-3 bg-[#071626] border border-slate-400/40 text-white rounded-md placeholder:text-slate-400 focus:border-[#5ee5e9] focus:ring-2 focus:ring-[#5ee5e9]/30 focus:outline-none transition duration-150"
                    />
                  </div>

                  {!isAuthenticated && (
                    <div className="form-group">
                      <label className="text-slate-100 text-xs tracking-wider uppercase font-semibold mb-2 block">
                        Account Password <span className="text-[#e85d4a] font-bold">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          required={!isAuthenticated}
                          minLength={8}
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="At least 8 characters"
                          className="w-full px-4 py-3 pr-12 bg-[#071626] border border-slate-400/40 text-white rounded-md placeholder:text-slate-400 focus:border-[#5ee5e9] focus:ring-2 focus:ring-[#5ee5e9]/30 focus:outline-none transition duration-150"
                        />
                        <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#5ee5e9]" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                          {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="text-slate-100 text-xs tracking-wider uppercase font-semibold mb-2 block">
                      Mobile Number <span className="text-[#e85d4a] font-bold">*</span>
                    </label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      required
                      autoComplete="tel"
                      inputMode="tel"
                      maxLength={20}
                      pattern="(?=(?:\D*\d){7})\+?[0-9().\s-]{7,20}"
                      title="Enter at least 7 digits; +, spaces, parentheses, hyphens, and periods are allowed."
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      placeholder="+65 9123 4567"
                      className="w-full px-4 py-3 bg-[#071626] border border-slate-400/40 text-white rounded-md placeholder:text-slate-400 focus:border-[#5ee5e9] focus:ring-2 focus:ring-[#5ee5e9]/30 focus:outline-none transition duration-150"
                    />
                  </div>

                  <div className="form-group">
                    <label className="text-slate-100 text-xs tracking-wider uppercase font-semibold mb-2 block">
                      Nationality <span className="text-slate-300 text-[11px] font-normal lowercase">(optional)</span>
                    </label>
                    <input
                      type="text"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleChange}
                      placeholder="Singaporean"
                      className="w-full px-4 py-3 bg-[#071626] border border-slate-400/40 text-white rounded-md placeholder:text-slate-400 focus:border-[#5ee5e9] focus:ring-2 focus:ring-[#5ee5e9]/30 focus:outline-none transition duration-150"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: PROFESSIONAL INFORMATION */}
              <div className="space-y-6">
                <h4 className="text-xs font-bold tracking-widest uppercase text-[#5ee5e9] border-b border-white/15 pb-2.5">
                  02. Professional & Company Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="text-slate-100 text-xs tracking-wider uppercase font-semibold mb-2 block">
                      Designation <span className="text-[#e85d4a] font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      name="designation"
                      required
                      value={formData.designation}
                      onChange={handleChange}
                      placeholder="Operations Manager"
                      className="w-full px-4 py-3 bg-[#071626] border border-slate-400/40 text-white rounded-md placeholder:text-slate-400 focus:border-[#5ee5e9] focus:ring-2 focus:ring-[#5ee5e9]/30 focus:outline-none transition duration-150"
                    />
                  </div>

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
                      placeholder="PSA International / PIL / Keppel"
                      className="w-full px-4 py-3 bg-[#071626] border border-slate-400/40 text-white rounded-md placeholder:text-slate-400 focus:border-[#5ee5e9] focus:ring-2 focus:ring-[#5ee5e9]/30 focus:outline-none transition duration-150"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="text-slate-100 text-xs tracking-wider uppercase font-semibold mb-2 block">
                    Description of Company <span className="text-[#e85d4a] font-bold">*</span>
                  </label>
                  <textarea
                    name="companyDescription"
                    required
                    rows={3}
                    value={formData.companyDescription}
                    onChange={handleChange}
                    placeholder="Brief summary of your company's activities in maritime, shipping, trading, or logistics..."
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
                    placeholder="Full corporate billing address in Singapore..."
                    className="w-full px-4 py-3 bg-[#071626] border border-slate-400/40 text-white rounded-md placeholder:text-slate-400 focus:border-[#5ee5e9] focus:ring-2 focus:ring-[#5ee5e9]/30 focus:outline-none transition duration-150"
                  />
                </div>
              </div>

              {/* SECTION 3: SOCIAL PREFERENCES */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold tracking-widest uppercase text-[#5ee5e9] border-b border-white/15 pb-2.5">
                  03. Social Preferences
                </h4>

                <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-200 font-medium leading-relaxed">
                  <input
                    type="checkbox"
                    name="followSocials"
                    checked={formData.followSocials}
                    onChange={handleChange}
                    className="mt-0.5 rounded accent-[var(--coral)] w-4 h-4"
                  />
                  <span>Follow WISTA Singapore on Instagram and LinkedIn, and WISTA International on Facebook, X, and YouTube for community updates and event announcements.</span>
                </label>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading || hasWrongRoleSession}
                className="w-full py-4 bg-[var(--coral)] hover:bg-[#f27663] text-white font-bold tracking-widest uppercase text-xs rounded transition flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Submitting Application...' : <>Submit Individual Application <ArrowUpRight size={16} /></>}
              </button>
            </form>
          )}
        </div>
      </section>
    </PageShell>
  )
}
