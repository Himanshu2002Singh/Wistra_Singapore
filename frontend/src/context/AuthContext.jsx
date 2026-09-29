import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loginApi, registerApi, getMeApi, logoutApi } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('wista_token'))
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const checkAuth = useCallback(async () => {
    const savedToken = localStorage.getItem('wista_token')
    if (!savedToken) {
      setUser(null)
      setToken(null)
      setIsLoading(false)
      return
    }

    try {
      const res = await getMeApi()
      if (res && res.success && res.user) {
        setUser(res.user)
        setToken(savedToken)
      } else {
        localStorage.removeItem('wista_token')
        setUser(null)
        setToken(null)
      }
    } catch (err) {
      localStorage.removeItem('wista_token')
      setUser(null)
      setToken(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (email, password) => {
    setError(null)
    try {
      const res = await loginApi({ email, password })
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
      const message = err.response?.data?.message || err.message || 'Invalid email or password.'
      setError(message)
      throw new Error(message)
    }
  }

  const register = async (userData) => {
    setError(null)
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
      const message = err.response?.data?.message || err.message || 'Registration failed'
      setError(message)
      throw err
    }
  }

  const logout = async () => {
    try {
      await logoutApi()
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('wista_token')
      setToken(null)
      setUser(null)
      setError(null)
    }
  }

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    error,
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
