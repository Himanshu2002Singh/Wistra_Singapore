import React, { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, LayoutDashboard, Lock, LogOut, Mail, ShieldCheck } from 'lucide-react'
import PageShell from '@/components/layout/PageShell'
import { useAuth } from '@/context/AuthContext'
import { getAdminRolesApi } from '@/services/authService'
import { hasAdministrativePermission, isAdministrativeRole } from '@/config/adminAccess'

function GatewayStatus({ title, children, action }) {
  return (
    <section className="public-login-panel mx-auto max-w-xl border border-[#d9dee3] bg-white p-8 md:p-12" role="alert">
      <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--teal)]"><ShieldCheck size={16} /> Admin access</p>
      <h1 className="mb-3 font-serif text-3xl text-white">{title}</h1>
      <p className="mb-6 text-sm leading-relaxed text-white/75">{children}</p>
      {action}
    </section>
  )
}

export default function AdminGateway() {
  const { user, isAuthenticated, isLoading, authError, checkAuth, login, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [roles, setRoles] = useState([])
  const [rolesLoading, setRolesLoading] = useState(true)
  const [rolesError, setRolesError] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let active = true
    getAdminRolesApi()
      .then((response) => {
        if (!active) return
        const availableRoles = response?.success && Array.isArray(response.data?.roles) ? response.data.roles : []
        setRoles(availableRoles.filter((role) => isAdministrativeRole(role.name)))
        setRolesError(availableRoles.length ? '' : 'No administrative roles are currently configured.')
      })
      .catch(() => {
        if (active) setRolesError('Administrative roles could not be loaded. Check the connection and try again.')
      })
      .finally(() => { if (active) setRolesLoading(false) })

    return () => { active = false }
  }, [])

  const roleName = user?.role?.name || user?.role
  const selectedRoleExists = isAdministrativeRole(roleName)
  const authenticatedAdmin = isAuthenticated && selectedRoleExists && hasAdministrativePermission(user)

  if (isLoading || (!isAuthenticated && rolesLoading)) {
    return (
      <PageShell currentPage="ADMIN ACCESS">
        <main className="route-section login-section grid min-h-[55vh] place-items-center px-5 py-16" role="status" aria-live="polite">
          <p className="text-sm text-white/80">Verifying administrative access…</p>
        </main>
      </PageShell>
    )
  }

  if (authError && localStorage.getItem('wista_token')) {
    return (
      <PageShell currentPage="ADMIN ACCESS">
        <main className="route-section login-section px-5 py-16">
          <GatewayStatus title="We can’t verify your session right now." action={<button type="button" onClick={checkAuth} className="rounded bg-[#0f2d52] px-5 py-3 text-xs font-bold uppercase tracking-widest text-white">Try again</button>}>
            The protected Admin Portal will remain closed until the existing authentication service can verify your account.
          </GatewayStatus>
        </main>
      </PageShell>
    )
  }

  if (isAuthenticated && authenticatedAdmin) {
    const requestedPath = location.state?.from?.pathname
    const destination = requestedPath?.startsWith('/admin/') && requestedPath !== '/admin/'
      ? requestedPath
      : '/admin/dashboard'
    return <Navigate to={destination} replace />
  }

  if (isAuthenticated) {
    return (
      <PageShell currentPage="ADMIN ACCESS">
        <main className="route-section login-section px-5 py-16">
          <GatewayStatus title="This account does not have Admin Portal access." action={<button type="button" onClick={logout} className="inline-flex items-center gap-2 rounded bg-[#0f2d52] px-5 py-3 text-xs font-bold uppercase tracking-widest text-white"><LogOut size={15} /> Sign out and use an admin account</button>}>
            You are signed in, but your verified account role does not grant administrative access. Selecting a role cannot change your account permissions.
          </GatewayStatus>
        </main>
      </PageShell>
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSubmitting(true)
    try {
      if (!selectedRole) throw new Error('Select an administrative role to continue.')
      const authenticatedUser = await login(email, password, { adminRole: selectedRole })
      const actualRole = authenticatedUser?.role?.name || authenticatedUser?.role
      if (actualRole !== selectedRole || !hasAdministrativePermission(authenticatedUser)) {
        await logout()
        throw new Error('This account is not authorized for the selected administrative role.')
      }

      const requestedPath = location.state?.from?.pathname
      const destination = requestedPath?.startsWith('/admin/') && requestedPath !== '/admin/'
        ? requestedPath
        : '/admin/dashboard'
      navigate(destination, { replace: true })
    } catch (error) {
      setErrorMessage(error.message || 'Admin sign-in failed. Check your credentials and selected role.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell currentPage="ADMIN ACCESS">
      <main className="route-section login-section px-5 py-12 sm:py-16">
        <section className="public-login-panel mx-auto max-w-xl border border-[#d9dee3] bg-white p-6 sm:p-8 md:p-12">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--teal)]"><ShieldCheck size={16} /> WISTA Singapore · Admin access</p>
          <h1 className="mb-2 font-serif text-3xl text-white sm:text-4xl">Administrator sign in</h1>
          <p className="mb-7 text-sm leading-relaxed text-white/75">Select your assigned role. Your credentials and actual permissions will be verified before the Admin Portal opens.</p>

          {errorMessage && <div className="mb-5 flex items-start gap-2 border border-red-400/50 bg-red-500/10 p-3 text-sm text-red-200" role="alert"><AlertCircle size={17} className="mt-0.5 shrink-0" /><span>{errorMessage}</span></div>}
          {rolesError && <div className="mb-5 flex items-start gap-2 border border-red-400/50 bg-red-500/10 p-3 text-sm text-red-200" role="alert"><AlertCircle size={17} className="mt-0.5 shrink-0" /><span>{rolesError}</span></div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <fieldset disabled={rolesLoading || roles.length === 0 || submitting}>
              <legend className="mb-3 text-xs font-bold uppercase tracking-widest text-white">1. Select your administrative role</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {roles.map((role) => (
                  <label key={role.name} className={`flex cursor-pointer items-start gap-3 border p-3 transition ${selectedRole === role.name ? 'border-[var(--teal)] bg-white/10' : 'border-white/20 hover:border-white/50'}`}>
                    <input type="radio" name="admin-role" value={role.name} checked={selectedRole === role.name} onChange={() => setSelectedRole(role.name)} className="mt-1 accent-[var(--teal)]" />
                    <span><span className="block text-xs font-bold uppercase tracking-wider text-white">{role.name.replaceAll('_', ' ')}</span><span className="mt-1 block text-xs leading-relaxed text-white/65">{role.description}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset disabled={!selectedRole || rolesLoading || submitting} className={!selectedRole ? 'opacity-50' : ''}>
              <legend className="mb-3 text-xs font-bold uppercase tracking-widest text-white">2. Enter administrator credentials</legend>
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-widest text-white" htmlFor="admin-email"><span className="mb-2 flex items-center gap-2"><Mail size={14} className="text-[var(--teal)]" /> Email address</span><input id="admin-email" type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded border border-white/20 bg-white/10 px-4 py-3 text-sm normal-case tracking-normal text-white outline-none focus:border-[var(--teal)]" placeholder="name@company.com" /></label>
                <label className="block text-xs font-bold uppercase tracking-widest text-white" htmlFor="admin-password"><span className="mb-2 flex items-center gap-2"><Lock size={14} className="text-[var(--teal)]" /> Password</span><input id="admin-password" type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded border border-white/20 bg-white/10 px-4 py-3 text-sm normal-case tracking-normal text-white outline-none focus:border-[var(--teal)]" placeholder="Enter your password" /></label>
              </div>
            </fieldset>

            <button type="submit" disabled={rolesLoading || roles.length === 0 || !selectedRole || submitting} className="flex w-full items-center justify-center gap-2 bg-[var(--coral)] px-5 py-4 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[#f27663] disabled:cursor-not-allowed disabled:opacity-50">
              {submitting ? 'Verifying access…' : <><LayoutDashboard size={15} /> Verify and open Admin Portal</>}
            </button>
          </form>

          <Link to="/" className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/65 hover:text-white"><ArrowLeft size={14} /> Return to public website</Link>
        </section>
      </main>
    </PageShell>
  )
}
