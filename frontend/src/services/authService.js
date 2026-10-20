import api from './api'

export const loginApi = async (credentials) => {
  const response = await api.post('/auth/login', credentials)
  return response.data
}

export const getAdminRolesApi = async () => {
  const response = await api.get('/auth/admin-roles')
  return response.data
}

export const registerApi = async (userData) => {
  const response = await api.post('/auth/register', userData)
  return response.data
}

export const requestPasswordResetApi = async (email) => {
  const response = await api.post('/auth/password-reset-requests', { email })
  return response.data
}

export const resetPasswordApi = async ({ token, password }) => {
  const response = await api.post('/auth/password-resets', { token, password })
  return response.data
}

export const getMeApi = async () => {
  const response = await api.get('/auth/me')
  return response.data
}

export const logoutApi = async () => {
  try {
    const response = await api.post('/auth/logout')
    return response.data
  } catch (error) {
    // Silently ignore network failure on logout
    return { success: true }
  }
}
