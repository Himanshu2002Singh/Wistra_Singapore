import React from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function AuthLoading() {
  return (
    <div role="status" aria-live="polite" style={{ display: 'grid', placeItems: 'center', minHeight: '55vh', color: 'var(--ink)', fontFamily: 'var(--serif)', fontSize: 24 }}>
      Restoring your WISTA session…
    </div>
  )
}

function AccessMessage({ title, children, action }) {
  return (
    <main role="main" style={{ display: 'grid', placeItems: 'center', minHeight: '65vh', padding: 24, background: 'var(--ivory)', color: 'var(--ink)' }}>
      <section role="alert" style={{ width: 'min(540px, 100%)', padding: 32, background: '#fff', border: '1px solid #d9dee3', borderTop: '4px solid #1b9aaa' }}>
        <p style={{ margin: '0 0 10px', color: '#1b7280', fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase' }}>WISTA Singapore</p>
        <h1 style={{ margin: '0 0 12px', fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 400 }}>{title}</h1>
        <p style={{ margin: '0 0 20px', color: '#536c7d', lineHeight: 1.6 }}>{children}</p>
        {action}
      </section>
    </main>
  )
}

export default function ProtectedRoute({ allowedRoles, requiredPermissions = [], allowSuperAdmin = true, children }) {
  const { user, isAuthenticated, isLoading, authError, checkAuth } = useAuth()
  const location = useLocation()

  if (isLoading) return <AuthLoading />

  if (authError && localStorage.getItem('wista_token')) {
    return (
      <AccessMessage title="We can’t verify your session right now." action={<button type="button" onClick={checkAuth} style={{ padding: '10px 14px', border: 0, background: '#0f2d52', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Try again</button>}>
        The authentication service is temporarily unavailable. Your protected page will remain closed until your session can be verified.
      </AccessMessage>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const roleName = user?.role?.name || user?.role || 'MEMBER'
  if (allowedRoles?.length && !(allowSuperAdmin && roleName === 'SUPER_ADMIN') && !allowedRoles.includes(roleName)) {
    return <AccessMessage title="You don’t have access to this area.">Your account is signed in, but it does not have a role that can open this page.</AccessMessage>
  }

  if (requiredPermissions.length && roleName !== 'SUPER_ADMIN') {
    const userPermissions = Array.isArray(user?.permissions) ? user.permissions : []
    if (!requiredPermissions.some((permission) => userPermissions.includes(permission))) {
      return <AccessMessage title="You don’t have permission to open this page.">Your administrator can grant access if this page is part of your responsibilities.</AccessMessage>
    }
  }

  return children || <Outlet />
}
