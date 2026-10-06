import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loginApi, registerApi, getMeApi, logoutApi } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('wista_token'))
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [authError, setAuthError] = useState(null)

  const checkAuth = useCallback(async () => {
    const savedToken = localStorage.getItem('wista_token')
    if (!savedToken) {
      setUser(null)
      setToken(null)
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
      setUser(null)
      setToken(null)
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
        setToken(authToken)
        setUser(userData)
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

  const register = async (userData) => {
    setError(null)
    setAuthError(null)
    try {
      const res = await registerApi(userData)
      if (res && res.success && res.data && res.data.token) {
        const authToken = res.data.token
        const userDataObj = res.data.user
        localStorage.setItem('wista_token', authToken)
        setToken(authToken)
        setUser(userDataObj)
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
      setToken(null)
      setUser(null)
      setError(null)
      setAuthError(null)
    }
  }

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    error,
    authError,
    login,
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
