import api from './api'

export const getMyMembershipApi = async () => {
  const response = await api.get('/membership/me')
  return response.data
}

export const getAdminMembershipsApi = async (params) => {
  const response = await api.get('/admin/memberships', { params })
  return response.data
}

export const getAdminMembershipByIdApi = async (id) => {
  const response = await api.get(`/admin/memberships/${id}`)
  return response.data
}

export const activateApprovedMembershipApi = async (applicationId) => {
  const response = await api.post('/admin/memberships/activate', { application_id: applicationId })
  return response.data
}

export const suspendMembershipApi = async (id, reason) => {
  const response = await api.patch(`/admin/memberships/${id}/suspend`, { reason })
  return response.data
}

export const reactivateMembershipApi = async (id) => {
  const response = await api.patch(`/admin/memberships/${id}/reactivate`)
  return response.data
}

export const cancelMembershipApi = async (id, cancellation_reason) => {
  const response = await api.patch(`/admin/memberships/${id}/cancel`, { cancellation_reason })
  return response.data
}
