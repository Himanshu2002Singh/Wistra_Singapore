import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CheckCircle2, FileText } from 'lucide-react'
import MemberLayout from '@/components/member/MemberLayout'
import { getMyApplicationByIdApi, resubmitApplicationClarificationApi, resubmitStudentClarificationApi } from '@/services/membershipService'
import industryCategories from '../../../../shared/industry-classification.json'

const inputClass = 'w-full rounded-md border border-slate-400/40 bg-[#071626] px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-[#5ee5e9] focus:outline-none focus:ring-2 focus:ring-[#5ee5e9]/30'
const labelClass = 'mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-100'

function Field({ label, name, value, onChange, type = 'text', required = true, error, options, rows = 3, help, ...props }) {
  const control = options
    ? <select id={name} name={name} value={value} onChange={onChange} required={required} className={inputClass} {...props}>
      <option value="">Choose {label.toLowerCase()}</option>
      {options.map((option) => typeof option === 'string'
        ? <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>
        : <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    : type === 'textarea'
      ? <textarea id={name} name={name} value={value} onChange={onChange} required={required} rows={rows} className={inputClass} {...props} />
      : <input id={name} name={name} type={type} value={value} onChange={onChange} required={required} className={inputClass} {...props} />

  return <div className="form-group">
    <label className={labelClass} htmlFor={name}>{label}{required && <span className="ml-1 text-[#e85d4a]">*</span>}</label>
    {control}
    {help && <p className="mt-1 text-xs text-slate-400">{help}</p>}
    {error && <p className="mt-1 text-xs text-red-300" role="alert">{error}</p>}
  </div>
}

const errorMessage = (error) => {
  const fieldErrors = error.response?.data?.errors
  if (fieldErrors && typeof fieldErrors === 'object') return Object.values(fieldErrors).filter(Boolean).join(' ')
  if (error.response?.status === 401) return 'Your session has expired. Sign in again to continue.'
  if (!error.response && error.message && error.message !== 'Network Error') return error.message
  return error.response?.data?.message || (!error.response ? 'Could not reach the application service. Check your connection and try again.' : 'Your application could not be resubmitted. Please try again.')
}

export default function ClarificationResponse() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [application, setApplication] = useState(null)
  const [form, setForm] = useState({})
  const [clarificationResponse, setClarificationResponse] = useState('')
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    let active = true
    getMyApplicationByIdApi(id).then((result) => {
      if (!active) return
      const data = result?.data
      if (!data) throw new Error('Application data is unavailable.')
      setApplication(data)
      const individual = data.profiles?.individual || {}
      const corporate = data.profiles?.corporate || {}
      const student = data.studentProfile || {}
      const representatives = (corporate.representatives || []).map((item) => [item.name, item.email, item.phone, item.designation].filter(Boolean).join(' | ')).join('\n')

      if (data.membership_type === 'INDIVIDUAL') {
        setForm({
          membership_type: 'INDIVIDUAL', company: individual.company || '', designation: individual.designation || '',
          biography: individual.biography || '', linkedin_url: individual.linkedin_url || '', photo_url: individual.photo_url || '',
          nationality: individual.nationality || '', date_of_birth: individual.date_of_birth || '',
          invoicing_address: individual.invoicing_address || '', phone: data.applicant?.phone || '',
        })
      } else if (data.membership_type === 'CORPORATE') {
        setForm({
          membership_type: 'CORPORATE', company_name: corporate.company_name || '', company_description: corporate.company_description || '',
          industry_main_category: corporate.industry_main_category || '', industry_sub_category: corporate.industry_sub_category || '',
          invoicing_contact_person: corporate.invoicing_contact_person || '', invoicing_email: corporate.contact_email || data.applicant?.email || '',
          invoicing_address: corporate.address || '', contact_phone: corporate.contact_phone || '',
          main_contacts: corporate.main_contacts || '', additional_contacts: corporate.additional_contacts || '', representatives,
        })
      } else {
        setForm({
          first_name: student.first_name || '', last_name: student.last_name || '', email: student.email || '',
          mobile_number: student.mobile_number || '', invoicing_address: student.invoicing_address || '',
          nationality: student.nationality || '', date_of_birth: student.date_of_birth || '',
          institution_name: student.institution_name || '', degree_type: student.degree_type || '', field_of_study: student.field_of_study || '',
          enrollment_type: student.enrollment_type || '', graduation_month: String(student.graduation_month || ''),
          graduation_year: String(student.graduation_year || ''),
        })
      }
    }).catch((loadError) => {
      if (active) setError(errorMessage(loadError))
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  const isStudent = application?.membership_type === 'STUDENT'
  const subCategories = useMemo(() => industryCategories[form.industry_main_category] || [], [form.industry_main_category])
  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'industry_main_category' ? { industry_sub_category: '' } : {}),
    }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    if (!clarificationResponse.trim()) {
      setFieldErrors((current) => ({ ...current, clarification_response: 'Please explain how you addressed the clarification request.' }))
      return
    }
    setSaving(true)
    setError('')
    setFieldErrors({})
    try {
      if (isStudent) {
        const body = new FormData()
        Object.entries(form).forEach(([key, value]) => body.append(key, value))
        body.append('clarification_response', clarificationResponse.trim())
        if (document) body.append('proof_of_enrollment', document)
        await resubmitStudentClarificationApi(id, body)
      } else {
        const data = { ...form, clarification_response: clarificationResponse.trim() }
        if (application.membership_type === 'CORPORATE') {
          data.representatives = String(form.representatives || '').split('\n').map((line) => line.trim()).filter(Boolean).map((line, index) => {
            const [name = '', email = '', phone = '', designation = ''] = line.split('|').map((part) => part.trim())
            return { name, email, phone, designation, is_primary: index === 0 }
          })
        }
        await resubmitApplicationClarificationApi(id, data)
      }
      navigate('/member/dashboard', { replace: true, state: { clarificationResubmitted: true } })
    } catch (submitError) {
      const serverErrors = submitError.response?.data?.errors
      if (serverErrors) setFieldErrors(serverErrors)
      setError(errorMessage(submitError))
    } finally {
      setSaving(false)
    }
  }

  const renderFields = () => {
    const field = (label, name, options = {}) => <Field key={name} label={label} name={name} value={form[name] || ''} onChange={updateField} error={fieldErrors[name]} {...options} />
    if (application.membership_type === 'INDIVIDUAL') return <>
      {field('Company', 'company')}{field('Designation', 'designation')}
      {field('Biography', 'biography', { type: 'textarea' })}{field('Mobile number', 'phone', { type: 'tel', inputMode: 'tel', pattern: '(?=(?:\\D*\\d){7})\\+?[0-9().\\s-]{7,20}', title: 'Enter at least 7 digits; +, spaces, parentheses, hyphens, and periods are allowed.' })}
      {field('Nationality', 'nationality', { required: false })}{field('Date of birth', 'date_of_birth', { type: 'date' })}
      {field('Invoicing address', 'invoicing_address', { type: 'textarea' })}{field('LinkedIn profile URL', 'linkedin_url', { type: 'url', required: false })}
      {field('Photo URL', 'photo_url', { type: 'url', required: false })}
    </>
    if (application.membership_type === 'CORPORATE') return <>
      {field('Company name', 'company_name')}{field('Company description', 'company_description', { type: 'textarea' })}
      {field('Main industry category', 'industry_main_category', { options: Object.keys(industryCategories).map((item) => ({ value: item, label: item })) })}
      {field('Industry sub-category', 'industry_sub_category', { options: subCategories })}
      {field('Invoicing contact person', 'invoicing_contact_person')}{field('Invoicing email', 'invoicing_email', { type: 'email' })}
      {field('Contact phone', 'contact_phone', { type: 'tel', required: false })}{field('Invoicing address', 'invoicing_address', { type: 'textarea' })}
      {field('Main contacts', 'main_contacts', { type: 'textarea' })}{field('Additional contacts', 'additional_contacts', { type: 'textarea' })}
      {field('Representatives', 'representatives', { type: 'textarea', required: false, help: 'One per line: name | email | phone | designation' })}
    </>
    return <>
      <div className="grid gap-5 sm:grid-cols-2">{field('First name', 'first_name')}{field('Last name', 'last_name')}</div>
      {field('Email address', 'email', { type: 'email', readOnly: true, title: 'The email must match your member account.' })}
      <div className="grid gap-5 sm:grid-cols-2">{field('Mobile number', 'mobile_number', { type: 'tel', inputMode: 'tel', pattern: '(?=(?:\\D*\\d){7})\\+?[0-9().\\s-]{7,30}', title: 'Enter at least 7 digits; +, spaces, parentheses, hyphens, and periods are allowed.' })}{field('Nationality', 'nationality')}</div>
      {field('Date of birth', 'date_of_birth', { type: 'date' })}{field('Invoicing address', 'invoicing_address', { type: 'textarea' })}
      {field('Institution name', 'institution_name')}{field('Degree type', 'degree_type')}{field('Field of study', 'field_of_study')}
      <div className="grid gap-5 sm:grid-cols-3">{field('Enrollment type', 'enrollment_type', { options: ['FULL_TIME', 'PART_TIME'] })}{field('Graduation month', 'graduation_month', { options: Array.from({ length: 12 }, (_, index) => ({ value: String(index + 1), label: new Date(2000, index).toLocaleString('en', { month: 'long' }) })) })}{field('Graduation year', 'graduation_year', { type: 'number', min: new Date().getFullYear() })}</div>
      <div className="form-group">
        <label className={labelClass} htmlFor="proof_of_enrollment">Replace proof of enrollment (optional)</label>
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-white/10 bg-[#071626] p-3 text-xs text-slate-300"><FileText size={16} className="text-[#5ee5e9]" />{application.studentProfile?.document_original_name || 'Current proof of enrollment is on file.'}</div>
        <input id="proof_of_enrollment" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => setDocument(event.target.files?.[0] || null)} className="mt-2 block w-full text-xs text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-[#163d5a] file:px-3 file:py-2 file:text-white" />
        {fieldErrors.proof_of_enrollment && <p className="mt-1 text-xs text-red-300" role="alert">{fieldErrors.proof_of_enrollment}</p>}
      </div>
    </>
  }

  return <MemberLayout>
    <div className="mx-auto max-w-4xl space-y-7 pb-16">
      <Link to="/member/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[#5ee5e9] hover:text-white"><ArrowLeft size={16} /> Back to dashboard</Link>
      <header className="border-b border-white/10 pb-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#5ee5e9]">Membership application</p>
        <h1 className="font-[var(--serif)] text-3xl text-white sm:text-4xl">Respond to clarification</h1>
        <p className="mt-2 text-sm text-slate-300">Update the requested details and explain what you changed before resubmitting.</p>
      </header>
      {loading ? <div className="rounded-xl border border-white/10 bg-[#0c243b] p-6 text-sm text-slate-300" role="status">Loading your application…</div> : error && !application ? <div className="rounded-xl border border-red-300/30 bg-red-400/10 p-5 text-sm text-red-200" role="alert">{error}</div> : application?.status !== 'CLARIFICATION_REQUIRED' ? <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-5 text-sm text-amber-100" role="status"><p>This application is not currently waiting for clarification.</p><p className="mt-2">Current status: <strong>{application?.status?.replaceAll('_', ' ') || 'Unavailable'}</strong></p></div> : <>
        <section className="rounded-xl border border-amber-500/40 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950 shadow-sm" aria-labelledby="request-heading">
          <div className="mb-2 flex items-center gap-2 font-bold" id="request-heading"><AlertCircle size={17} /> Clarification requested by WISTA Singapore</div>
          <p className="whitespace-pre-wrap">{application.review_remarks || 'Please review your application and provide the requested clarification.'}</p>
        </section>
        {error && <div role="alert" className="rounded-lg border border-red-300/30 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-white/10 bg-[#0c243b] p-5 shadow-2xl sm:p-8">
          <section className="space-y-5">
            <h2 className="border-b border-white/10 pb-3 text-xs font-bold uppercase tracking-widest text-[#5ee5e9]">Edit application details</h2>
            <div className="space-y-5">{renderFields()}</div>
          </section>
          <section className="space-y-3 border-t border-white/10 pt-6">
            <label className={labelClass} htmlFor="clarification_response">Your response to the clarification <span className="text-[#e85d4a]">*</span></label>
            <textarea id="clarification_response" name="clarification_response" value={clarificationResponse} onChange={(event) => { setClarificationResponse(event.target.value); setFieldErrors((current) => ({ ...current, clarification_response: '' })) }} rows="4" maxLength="4000" required className={inputClass} placeholder="Explain what you corrected or added in your application." />
            {fieldErrors.clarification_response && <p className="text-xs text-red-300" role="alert">{fieldErrors.clarification_response}</p>}
            <p className="text-xs text-slate-400">This response is required and will be sent to the review team with your updated application.</p>
          </section>
          <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">
            <Link to="/member/dashboard" className="rounded border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-200 hover:bg-white/5">Cancel</Link>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded bg-[var(--coral)] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Resubmitting…' : <><CheckCircle2 size={15} /> Save and resubmit</>}</button>
          </div>
        </form>
      </>}
    </div>
  </MemberLayout>
}
