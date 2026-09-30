import api from './api'

export const submitApplicationApi = async (applicationData) => {
  const response = await api.post('/membership/applications', applicationData)
  return response.data
}

export const getMyApplicationsApi = async () => {
  const response = await api.get('/membership/applications/me')
  return response.data
}

export const getMyApplicationByIdApi = async (id) => {
  const response = await api.get(`/membership/applications/me/${id}`)
  return response.data
}

export const getAdminApplicationsApi = async (params) => {
  const response = await api.get('/admin/applications', { params })
  return response.data
}

export const getAdminApplicationByIdApi = async (id) => {
  const response = await api.get(`/admin/applications/${id}`)
  return response.data
}

export const reviewApplicationApi = async (id) => {
  const response = await api.patch(`/admin/applications/${id}/review`)
  return response.data
}

export const approveApplicationApi = async (id, review_remarks) => {
  const response = await api.patch(`/admin/applications/${id}/approve`, { review_remarks })
  return response.data
}

export const rejectApplicationApi = async (id, review_remarks) => {
  const response = await api.patch(`/admin/applications/${id}/reject`, { review_remarks })
  return response.data
}

export const requestClarificationApi = async (id, review_remarks) => {
  const response = await api.patch(`/admin/applications/${id}/clarification`, { review_remarks })
  return response.data
}

