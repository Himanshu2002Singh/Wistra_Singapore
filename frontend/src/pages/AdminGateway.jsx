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
        const adminRoles = availableRoles.filter((role) => isAdministrativeRole(role.name))
        if (!adminRoles.some((role) => role.name === 'SUPER_ADMIN')) {
          adminRoles.push({ name: 'SUPER_ADMIN', description: 'Temporary frontend-only client demonstration access' })
        }
        setRoles(adminRoles)
        setRolesError(availableRoles.length ? '' : 'No administrative roles are currently configured in the local backend.')
      })
      .catch(() => {
        if (active) {
          setRoles([{ name: 'SUPER_ADMIN', description: 'Full system access' }])
          setRolesError('The admin service is unavailable. Sign-in still requires a real account in the local backend.')
        }
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
      <main className="admin-login-page">
        <section className="admin-login-panel">
          <header className="admin-login-header">
            <p className="admin-login-eyebrow"><ShieldCheck size={16} aria-hidden="true" /> WISTA Singapore <span>/</span> Admin access</p>
            <h1>Administrator sign in</h1>
            <p>Live access is checked against your backend account and assigned role. Client demo access opens the portal UI only and cannot use admin APIs.</p>
          </header>
          <p className="admin-login-demo-note" role="note">Admin access is verified against the local backend account and its assigned role. Demo-only sessions cannot access live records.</p>

          {errorMessage && <div className="admin-login-alert" role="alert"><AlertCircle size={17} aria-hidden="true" /><span>{errorMessage}</span></div>}
          {rolesError && <div className="admin-login-alert" role="alert"><AlertCircle size={17} aria-hidden="true" /><span>{rolesError}</span></div>}

          <form onSubmit={handleSubmit} className="admin-login-form">
            <fieldset className="admin-login-fieldset" disabled={rolesLoading || roles.length === 0 || submitting}>
              <legend>01 <span>/</span> Select your administrative role</legend>
              <div className="admin-login-roles">
                {roles.map((role) => (
                  <label key={role.name} className={`admin-login-role ${selectedRole === role.name ? 'is-selected' : ''}`}>
                    <input type="radio" name="admin-role" value={role.name} checked={selectedRole === role.name} onChange={() => setSelectedRole(role.name)} />
                    <span className="admin-login-role-copy"><strong>{role.name.replaceAll('_', ' ')}</strong><span>{role.description}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className={`admin-login-fieldset ${!selectedRole ? 'is-disabled' : ''}`} disabled={!selectedRole || rolesLoading || submitting}>
              <legend>02 <span>/</span> Enter administrator credentials</legend>
              <div className="admin-login-credentials">
                <label htmlFor="admin-email"><span><Mail size={14} aria-hidden="true" /> Email address</span><input id="admin-email" type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" /></label>
                <label htmlFor="admin-password"><span><Lock size={14} aria-hidden="true" /> Password</span><input id="admin-password" type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /></label>
              </div>
            </fieldset>

            <button type="submit" disabled={rolesLoading || roles.length === 0 || !selectedRole || submitting} className="admin-login-submit">
              {submitting ? 'Verifying access…' : <><LayoutDashboard size={15} /> Verify and open Admin Portal</>}
            </button>
          </form>

          <Link to="/" className="admin-login-return"><ArrowLeft size={14} aria-hidden="true" /> Return to public website</Link>
        </section>
      </main>
    </PageShell>
  )
}
