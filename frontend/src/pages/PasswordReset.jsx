import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AlertCircle, Lock, Mail } from 'lucide-react'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import { requestPasswordResetApi, resetPasswordApi } from '@/services/authService'
import loginHeroBg from '../assets/images/wista/committees/committee-yukie-profile.jpg'

export default function PasswordReset() {
  const location = useLocation()
  const token = new URLSearchParams(location.search).get('token') || ''
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null)

  const handleRequest = async (event) => {
    event.preventDefault()
    setLoading(true)
    setNotice(null)
    try {
      const result = await requestPasswordResetApi(email)
      setNotice({ type: 'info', message: result.message })
    } catch (error) {
      setNotice({ type: 'error', message: error.response?.data?.message || 'The reset request could not be processed. Please try again later.' })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (event) => {
    event.preventDefault()
    setNotice(null)
    if (password !== confirmPassword) {
      setNotice({ type: 'error', message: 'The passwords do not match.' })
      return
    }
    setLoading(true)
    try {
      const result = await resetPasswordApi({ token, password })
      setNotice({ type: 'success', message: result.message })
      setPassword('')
      setConfirmPassword('')
    } catch (error) {
      setNotice({ type: 'error', message: error.response?.data?.message || 'The password could not be reset. Request a new reset token.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell currentPage="PASSWORD RESET">
      <PageIntro
        eyebrow="MEMBER ACCESS"
        title={token ? <>Choose a new <em>password.</em></> : <>Reset your <em>password.</em></>}
        lead={token ? 'Set a new password for your WISTA Singapore account.' : 'Request assistance with your WISTA Singapore account password.'}
        bgImage={loginHeroBg}
        variant="login"
      />
      <section className="route-section login-section py-16">
        <div className="public-login-panel max-w-md mx-auto bg-white border border-[#d9dee3] p-8 md:p-12">
          {notice && (
            <div role={notice.type === 'error' ? 'alert' : 'status'} className={`mb-6 rounded border p-4 text-xs font-semibold ${notice.type === 'error' ? 'border-red-500/50 bg-red-500/10 text-red-800' : 'border-emerald-700/20 bg-emerald-50 text-emerald-900'}`}>
              {notice.type === 'error' && <AlertCircle size={16} className="mr-2 inline" />}{notice.message}
            </div>
          )}

          {!token ? (
            <form onSubmit={handleRequest} className="space-y-6">
              <div className="form-group">
                <label htmlFor="reset-email" className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white"><Mail size={14} className="text-[var(--teal)]" /> Email Address</label>
                <input id="reset-email" type="email" autoComplete="email" required maxLength={255} value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-[var(--teal)] focus:outline-none" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[var(--coral)] px-4 py-4 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[#f27663] disabled:opacity-60">
                {loading ? 'Submitting…' : 'Request password reset'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              <div className="form-group">
                <label htmlFor="new-password" className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white"><Lock size={14} className="text-[var(--teal)]" /> New Password</label>
                <input id="new-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-[var(--teal)] focus:outline-none" />
              </div>
              <div className="form-group">
                <label htmlFor="confirm-password" className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white"><Lock size={14} className="text-[var(--teal)]" /> Confirm Password</label>
                <input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-[var(--teal)] focus:outline-none" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[var(--coral)] px-4 py-4 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[#f27663] disabled:opacity-60">
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}

          <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/70">
            <Link to="/login" className="font-bold text-[var(--teal)] hover:underline">Return to sign in</Link>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
