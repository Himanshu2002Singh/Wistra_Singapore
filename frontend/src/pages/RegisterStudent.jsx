import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import { submitStudentApplicationApi } from '@/services/membershipService'
import studentHero from '../assets/images/wista/membership/membership-reception.jpg'

const currentYear = new Date().getFullYear()
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const getErrorMessage = (error) => {
  const response = error.response
  if (response?.status === 409) return response.data?.message || 'An application already exists for this email address.'
  if (response?.status === 413) return 'The supporting document must be 5 MB or smaller.'
  if (response?.status === 400 && response.data?.errors) return Object.values(response.data.errors).join(' ')
  if (response?.status >= 500) return 'The application service is temporarily unavailable. Please try again later.'
  if (!response) return 'Could not reach the application service. Check your connection and try again.'
  return response.data?.message || 'The application could not be submitted. Check your details and try again.'
}

const fieldClass = 'w-full px-4 py-3 bg-[#071626] border border-slate-400/40 text-white rounded-md placeholder:text-slate-400 focus:border-[#5ee5e9] focus:ring-2 focus:ring-[#5ee5e9]/30 focus:outline-none transition duration-150'
const labelClass = 'text-slate-100 text-xs tracking-wider uppercase font-semibold mb-2 block'
const sectionHeadingClass = 'text-xs font-bold tracking-widest uppercase text-[#5ee5e9] border-b border-white/15 pb-2.5'

function Field({ label, name, type = 'text', value, onChange, required = true, ...props }) {
  return <div className="form-group">
    <label className={labelClass} htmlFor={name}>{label}{required && <span className="font-bold text-[#e85d4a]"> *</span>}</label>
    <input className={fieldClass} id={name} name={name} type={type} value={value} onChange={onChange} required={required} {...props} />
  </div>
}

export default function RegisterStudent() {
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', mobile_number: '', invoicing_address: '', nationality: '', date_of_birth: '',
    institution_name: '', degree_type: '', field_of_study: '', enrollment_type: '', graduation_month: '', graduation_year: '',
  })
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(null)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const submitLock = useRef(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
  }

  const validate = () => {
    const errors = {}
    const digits = formData.mobile_number.replace(/\D/g, '').length
    if (!/^[+0-9().\s-]{7,30}$/.test(formData.mobile_number) || digits < 7) errors.mobile_number = 'Enter a valid mobile number with country code.'
    if (formData.graduation_year && formData.graduation_month) {
      const graduation = Number(formData.graduation_year) * 12 + Number(formData.graduation_month)
      const today = new Date()
      if (graduation < today.getFullYear() * 12 + today.getMonth() + 1) errors.graduation_year = 'Expected graduation must be this month or later.'
    }
    if (document && document.size > 5 * 1024 * 1024) errors.proof_of_enrollment = 'The supporting document must be 5 MB or smaller.'
    if (document && !['application/pdf', 'image/jpeg', 'image/png'].includes(document.type)) errors.proof_of_enrollment = 'Upload a PDF, JPEG, or PNG document.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitLock.current || !validate()) return
    submitLock.current = true
    setLoading(true)
    setError('')
    try {
      const payload = new FormData()
      Object.entries(formData).forEach(([key, value]) => payload.append(key, value))
      if (document) payload.append('proof_of_enrollment', document)
      const response = await submitStudentApplicationApi(payload)
      if (!response?.success || !response.data?.application_number) throw new Error(response?.message || 'Application submission failed.')
      setSubmitted(response.data)
      window.scrollTo({ top: 300, behavior: 'smooth' })
    } catch (submissionError) {
      setError(getErrorMessage(submissionError))
      if (submissionError.response?.data?.errors) setFieldErrors(submissionError.response.data.errors)
    } finally {
      setLoading(false)
      submitLock.current = false
    }
  }

  return <PageShell currentPage="STUDENT MEMBERSHIP">
    <PageIntro
      eyebrow="MEMBERSHIP APPLICATION"
      title={<>Student <em>Membership.</em></>}
      lead="Share your details and current proof of enrollment to apply for Student Membership."
      bgImage={studentHero}
      variant="form"
    />

    <section className="route-section registration-form-section py-16">
      <div className="mx-auto max-w-3xl px-4 md:px-0">
        <div className="mb-8 flex items-center justify-between text-xs">
          <Link to="/register" className="application-back-link text-[#5ee5e9] hover:text-white flex items-center gap-1.5 font-semibold tracking-wide transition"><ArrowLeft size={14} /> Back to Membership Options</Link>
          <span className="font-medium text-slate-300">WISTA Singapore Chapter</span>
        </div>

        {submitted ? <div className="rounded-xl border border-[#5ee5e9] bg-[#0c243b] p-8 text-center shadow-2xl md:p-12" role="status">
          <CheckCircle2 size={56} className="mx-auto mb-6 text-[#5ee5e9]" />
          <h2 className="mb-4 font-[var(--serif)] text-3xl text-white">Application Submitted</h2>
          <p className="mx-auto mb-5 max-w-lg text-sm leading-relaxed text-slate-200">Thank you, <strong className="text-white">{formData.first_name} {formData.last_name}</strong>. Your Student Membership application has been received for review.</p>
          <p className="mb-7 inline-block rounded border border-[#5ee5e9]/40 bg-[#5ee5e9]/10 px-4 py-2 font-mono text-xs font-bold text-[#5ee5e9]">Application #: {submitted.application_number}</p>
          <p className="text-xs leading-relaxed text-slate-300">The WISTA Singapore Executive Committee will review your application.</p>
          <Link to="/membership" className="mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#5ee5e9] hover:text-white">Explore membership <ArrowUpRight size={14} /></Link>
        </div> : <form onSubmit={handleSubmit} className="public-application-form bg-[#0c243b] border border-white/15 p-8 md:p-12 rounded-xl shadow-2xl space-y-10">
          <div className="border-b border-white/15 pb-5">
            <h3 className="font-[var(--serif)] text-3xl text-white font-normal mb-2 tracking-tight">Student Membership Application Form</h3>
            <p className="text-xs text-slate-300 font-medium">Fields marked with <span className="text-[#e85d4a] font-bold">*</span> are required.</p>
          </div>

          {error && <div className="p-4 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-xs font-semibold flex items-center gap-2" role="alert"><AlertCircle size={16} className="text-red-400 shrink-0" /><span>{error}</span></div>}

          <div className="space-y-6">
            <h4 className={sectionHeadingClass}>01. Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="First name" name="first_name" autoComplete="given-name" value={formData.first_name} onChange={handleChange} />
              <Field label="Last name" name="last_name" autoComplete="family-name" value={formData.last_name} onChange={handleChange} />
              <Field label="Email address — for invoicing and communications" name="email" type="email" autoComplete="email" maxLength={255} value={formData.email} onChange={handleChange} />
              <div><Field label="Mobile number — include country code" name="mobile_number" type="tel" autoComplete="tel" inputMode="tel" maxLength={30} value={formData.mobile_number} onChange={handleChange} aria-invalid={Boolean(fieldErrors.mobile_number)} aria-describedby={fieldErrors.mobile_number ? 'mobile-error' : undefined} />{fieldErrors.mobile_number && <p id="mobile-error" className="mt-1 text-xs text-red-300">{fieldErrors.mobile_number}</p>}</div>
              <div className="form-group md:col-span-2"><label className={labelClass} htmlFor="invoicing_address">Invoicing address <span className="font-bold text-[#e85d4a]">*</span></label><textarea id="invoicing_address" rows={3} className={`${fieldClass} resize-y normal-case tracking-normal`} name="invoicing_address" autoComplete="street-address" maxLength={10000} value={formData.invoicing_address} onChange={handleChange} required /></div>
              <Field label="Nationality" name="nationality" autoComplete="country-name" maxLength={100} value={formData.nationality} onChange={handleChange} />
              <Field label="Date of birth" name="date_of_birth" type="date" autoComplete="bday" max={new Date().toISOString().slice(0, 10)} value={formData.date_of_birth} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-6">
            <h4 className={sectionHeadingClass}>02. Education Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2"><Field label="Name of educational institution" name="institution_name" maxLength={255} value={formData.institution_name} onChange={handleChange} /></div>
              <Field label="Type of degree" name="degree_type" placeholder="e.g. Bachelor, Master, PhD" maxLength={150} value={formData.degree_type} onChange={handleChange} />
              <Field label="Field of study / Major" name="field_of_study" maxLength={255} value={formData.field_of_study} onChange={handleChange} />
              <div className="form-group md:col-span-2"><label className={labelClass} htmlFor="enrollment_type">Enrollment type <span className="font-bold text-[#e85d4a]">*</span></label><select id="enrollment_type" className={fieldClass} name="enrollment_type" value={formData.enrollment_type} onChange={handleChange} required><option value="">Select enrollment type</option><option value="FULL_TIME">Full-time</option><option value="PART_TIME">Part-time</option></select></div>
              <div className="form-group"><label className={labelClass} htmlFor="graduation_month">Expected graduation month <span className="font-bold text-[#e85d4a]">*</span></label><select id="graduation_month" className={fieldClass} name="graduation_month" value={formData.graduation_month} onChange={handleChange} required><option value="">Month</option>{months.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></div>
              <div className="form-group"><label className={labelClass} htmlFor="graduation_year">Expected graduation year <span className="font-bold text-[#e85d4a]">*</span></label><input id="graduation_year" className={fieldClass} name="graduation_year" type="number" min={currentYear} max="9999" step="1" inputMode="numeric" value={formData.graduation_year} onChange={handleChange} required /></div>
              {fieldErrors.graduation_year && <p className="text-xs text-red-300 md:col-span-2" role="alert">{fieldErrors.graduation_year}</p>}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className={sectionHeadingClass}>03. Supporting Document</h4>
            <div className="form-group"><label className={labelClass} htmlFor="proof_of_enrollment">Proof of enrollment <span className="font-bold text-[#e85d4a]">*</span></label>
              <input id="proof_of_enrollment" className={`${fieldClass} file:mr-4 file:border-0 file:bg-[#0f2d52] file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-wide file:text-white`} name="proof_of_enrollment" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" required onChange={(event) => { setDocument(event.target.files?.[0] || null); setFieldErrors((current) => ({ ...current, proof_of_enrollment: '' })) }} aria-describedby="document-help" />
            </div>
            <p id="document-help" className="text-xs leading-relaxed text-slate-300">Upload a current student ID card, official enrollment letter, tuition receipt, or other appropriate proof. PDF, JPEG, or PNG; maximum 5 MB.</p>
            {fieldErrors.proof_of_enrollment && <p className="text-xs text-red-300" role="alert">{fieldErrors.proof_of_enrollment}</p>}
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 bg-[var(--coral)] hover:bg-[#f27663] text-white font-bold tracking-widest uppercase text-xs rounded transition flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:cursor-wait disabled:opacity-60">
            {loading ? 'Submitting application…' : 'Submit Student Application'} {!loading && <ArrowUpRight size={16} />}
          </button>
        </form>}
      </div>
    </section>
  </PageShell>
}
