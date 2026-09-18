import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageShell from '@/components/layout/PageShell'
import PageIntro from '@/components/editorial/PageIntro'
import { ArrowUpRight, Lock, Mail } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      // Navigate to Member Dashboard for demo
      navigate('/member/dashboard')
    }, 800)
  }

  return (
    <PageShell currentPage="MEMBER LOGIN">
      <PageIntro 
        eyebrow="MEMBER ACCESS" 
        title={<>Sign in to your <em>portal.</em></>} 
        lead="Access your WISTA Singapore membership benefits, digital card, event registrations, and global directory."
      />

      <section className="route-section content-dark py-16">
        <div className="max-w-md mx-auto bg-white/5 border border-white/10 p-8 md:p-12 rounded-lg">
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
