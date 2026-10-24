import api from './api'

export const getAdminUsersApi = async (params) => {
  const response = await api.get('/admin/users', { params })
  return response.data
}

export const getAdminUserByIdApi = async (id) => {
  const response = await api.get(`/admin/users/${id}`)
  return response.data
}

export const getAdminRolesApi = async () => {
  const response = await api.get('/admin/users/roles')
  return response.data
}

export const getAdminPermissionsApi = async () => {
  const response = await api.get('/admin/users/permissions')
  return response.data
}

export const assignExistingAdminUserRoleApi = async (data) => {
  const response = await api.post('/admin/users/assign-role', data)
  return response.data
}

export const createAdminTeamMemberApi = async (data) => {
  const response = await api.post('/admin/users/create', data)
  return response.data
}

export const updateAdminTeamMemberApi = async (id, data) => {
  const response = await api.put(`/admin/users/${id}`, data)
  return response.data
}

export const removeAdminTeamMemberApi = async (id) => {
  const response = await api.delete(`/admin/users/${id}`)
  return response.data
}
