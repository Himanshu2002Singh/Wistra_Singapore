import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach JWT token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('wista_token')?.trim()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else if (config.headers?.Authorization) {
      delete config.headers.Authorization
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle 401 unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear invalid token if request failed with 401 (except for login route itself)
      const requestUrl = error.config?.url || ''
      const isPublicAuthRequest = /\/auth\/(login|register)(?:\?|$)/.test(requestUrl)
      if (!isPublicAuthRequest) {
        localStorage.removeItem('wista_token')
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('wista:auth-invalid', {
            detail: { message: 'Your session expired or is no longer valid. Please sign in again.' },
          }))
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
