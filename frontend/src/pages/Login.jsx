import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import { ArrowUpRight, Lock, Mail, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import loginHeroBg from '../assets/images/wista/committees/committee-yukie-profile.jpg'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setLoading(true)

    try {
      await login(email, password)
      setLoading(false)

      const requestedPath = location.state?.from?.pathname
      const redirectPath = requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
        ? requestedPath
        : null

      if (redirectPath && !redirectPath.startsWith('/admin')) {
        navigate(redirectPath, { replace: true })
      } else {
        navigate('/member/dashboard', { replace: true })
      }
    } catch (err) {
      setLoading(false)
      if (err.message === 'Administrator accounts must sign in through the admin access gateway.') {
        navigate('/admin', { replace: true })
        return
      }
      setErrorMessage(err.message || 'Invalid email or password.')
    }
  }

  return (
    <PageShell currentPage="MEMBER LOGIN">
      <PageIntro 
        eyebrow="MEMBER ACCESS" 
        title={<>Sign in to your <em>portal.</em></>} 
        lead="Access your WISTA Singapore membership benefits, digital card, event registrations, and global directory."
        bgImage={loginHeroBg}
        variant="login"
      />

      <section className="route-section login-section py-16">
        <div className="public-login-panel max-w-md mx-auto bg-white border border-[#d9dee3] p-8 md:p-12">
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="text-white text-xs tracking-widest uppercase font-bold mb-2 flex items-center gap-2">
                <Mail size={14} className="text-[var(--teal)]" /> Email Address
              </label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com" 
                className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded focus:border-[var(--teal)] focus:outline-none"
              />
            </div>

            <div className="form-group">
              <div className="flex justify-between items-center mb-2">
                <label className="text-white text-xs tracking-widest uppercase font-bold flex items-center gap-2">
                  <Lock size={14} className="text-[var(--teal)]" /> Password
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Password reset link sent to your email.'); }} className="text-xs text-[var(--teal)] hover:underline">
                  Forgot password?
                </a>
              </div>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded focus:border-[var(--teal)] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-white/80">
                <input 
                  type="checkbox" 
                  checked={remember} 
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded accent-[var(--coral)]"
                />
                Remember me on this device
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-[var(--coral)] hover:bg-[#f27663] text-white font-bold tracking-widest uppercase text-xs transition flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : <>Member Sign In <ArrowUpRight size={16} /></>}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-white/60">
            Don't have a WISTA Singapore membership yet?{' '}
            <Link to="/register" className="text-[var(--teal)] font-bold hover:underline">
              Apply for membership →
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
