import React from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function DefaultLoading() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--ivory)',
        color: 'var(--ink)',
        fontFamily: 'var(--serif)',
        fontSize: '24px',
        letterSpacing: '-.02em',
      }}
    >
      WISTA Singapore
    </div>
  )
}

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <DefaultLoading />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const roleName = user?.role?.name || user?.role || 'MEMBER'

  if (allowedRoles && allowedRoles.length > 0) {
    const isSuperAdmin = roleName === 'SUPER_ADMIN'
    const isAllowed = isSuperAdmin || allowedRoles.includes(roleName)

    if (!isAllowed) {
      // If user is a MEMBER trying to access admin route, redirect to member dashboard
      if (location.pathname.startsWith('/admin')) {
        return <Navigate to="/member/dashboard" replace />
      }
      return <Navigate to="/" replace />
    }
  }

  return children ? children : <Outlet />
}
