import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loginApi, registerApi, getMeApi, logoutApi } from '../services/authService'

const AuthContext = createContext(null)

const ADMIN_DEMO_STORAGE_KEY = 'wista_admin_demo'
const ADMIN_DEMO_CREDENTIALS = {
  email: 'rbac.superadmin@example.com',
  password: 'Password123!',
  user: {
    id: 'admin-demo',
    first_name: 'Demo',
    last_name: 'Super Admin',
    email: 'rbac.superadmin@example.com',
    status: 'ACTIVE',
    role: { name: 'SUPER_ADMIN', description: 'Frontend-only demonstration access' },
    permissions: [],
    is_demo: true,
  },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('wista_token'))
  const [isDemo, setIsDemo] = useState(() => localStorage.getItem(ADMIN_DEMO_STORAGE_KEY) === 'true')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [authError, setAuthError] = useState(null)

  const checkAuth = useCallback(async () => {
    if (localStorage.getItem(ADMIN_DEMO_STORAGE_KEY) === 'true') {
      setUser(ADMIN_DEMO_CREDENTIALS.user)
      setToken(null)
      setIsDemo(true)
      setAuthError(null)
      setIsLoading(false)
      return
    }

    const savedToken = localStorage.getItem('wista_token')
    if (!savedToken) {
      setUser(null)
      setToken(null)
      setIsDemo(false)
      setAuthError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setAuthError(null)
    try {
      const res = await getMeApi()
      if (res && res.success && res.user) {
        setUser(res.user)
        setToken(savedToken)
      } else {
        localStorage.removeItem('wista_token')
        setUser(null)
        setToken(null)
        setAuthError(null)
      }
    } catch (err) {
      if (err.response && err.response.status < 500) {
        localStorage.removeItem('wista_token')
        setUser(null)
        setToken(null)
        setAuthError(null)
      } else {
        setAuthError('The authentication service is temporarily unavailable.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    const handleInvalidSession = (event) => {
      localStorage.removeItem('wista_token')
      localStorage.removeItem(ADMIN_DEMO_STORAGE_KEY)
      setUser(null)
      setToken(null)
      setIsDemo(false)
      setAuthError(null)
      setError(event.detail?.message || 'Your session expired. Please sign in again.')
    }
    window.addEventListener('wista:auth-invalid', handleInvalidSession)
    return () => window.removeEventListener('wista:auth-invalid', handleInvalidSession)
  }, [])

  const login = async (email, password, { adminRole } = {}) => {
    setError(null)
    setAuthError(null)
    try {
      const res = await loginApi({
        email,
        password,
        ...(adminRole ? { admin_role: adminRole } : {}),
      })
      if (res && res.success && res.data && res.data.token) {
        const authToken = res.data.token
        const userData = res.data.user
        localStorage.setItem('wista_token', authToken)
        localStorage.removeItem(ADMIN_DEMO_STORAGE_KEY)
        setToken(authToken)
        setUser(userData)
        setIsDemo(false)
        return userData
      } else {
        throw new Error(res.message || 'Login failed')
      }
    } catch (err) {
      const message = !err.response
        ? 'Unable to reach the sign-in service. Please try again.'
        : err.response.status >= 500
          ? 'The sign-in service is temporarily unavailable. Please try again.'
          : (err.response.data?.message || 'Invalid email or password.')
      setError(message)
      throw new Error(message)
    }
  }

  const loginDemo = ({ email, password, adminRole }) => {
    if (adminRole !== 'SUPER_ADMIN'
      || email.trim().toLowerCase() !== ADMIN_DEMO_CREDENTIALS.email
      || password !== ADMIN_DEMO_CREDENTIALS.password) {
      throw new Error('Invalid demo credentials or role.')
    }

    localStorage.removeItem('wista_token')
    localStorage.setItem(ADMIN_DEMO_STORAGE_KEY, 'true')
    setToken(null)
    setUser(ADMIN_DEMO_CREDENTIALS.user)
    setIsDemo(true)
    setError(null)
    setAuthError(null)
    return ADMIN_DEMO_CREDENTIALS.user
  }

  const register = async (userData) => {
    setError(null)
    setAuthError(null)
    try {
      const res = await registerApi(userData)
      if (res && res.success && res.data && res.data.token) {
        const authToken = res.data.token
        const userDataObj = res.data.user
        localStorage.setItem('wista_token', authToken)
        localStorage.removeItem(ADMIN_DEMO_STORAGE_KEY)
        setToken(authToken)
        setUser(userDataObj)
        setIsDemo(false)
      }
      return res
    } catch (err) {
      const message = !err.response
        ? 'Unable to reach the registration service. Please try again.'
        : err.response.status >= 500
          ? 'The registration service is temporarily unavailable. Please try again.'
          : (err.response.data?.message || 'Registration failed.')
      setError(message)
      throw err
    }
  }

  const logout = async () => {
    try {
      await logoutApi()
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('wista_token')
      localStorage.removeItem(ADMIN_DEMO_STORAGE_KEY)
      setToken(null)
      setUser(null)
      setIsDemo(false)
      setError(null)
      setAuthError(null)
    }
  }

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && (token || isDemo)),
    isDemo,
    isLoading,
    error,
    authError,
    login,
    loginDemo,
    register,
    logout,
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
