import axios from 'axios'

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '')
const API_BASE_URL = configuredApiUrl
  ? (configuredApiUrl.endsWith('/api') ? configuredApiUrl : `${configuredApiUrl}/api`)
  : (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api')

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
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type']
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
      const isAdminDemoSession = localStorage.getItem('wista_admin_demo') === 'true'
      if (!isPublicAuthRequest && !isAdminDemoSession) {
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
