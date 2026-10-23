import api from './api'

export const submitApplicationApi = async (applicationData) => {
  const response = await api.post('/membership/applications', applicationData)
  return response.data
}

export const submitStudentApplicationApi = async (applicationData) => {
  // Override the API client's default JSON content type so Axios preserves the
  // FormData body. The browser then supplies the multipart boundary.
  const response = await api.post('/membership/applications/student', applicationData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const getMyStudentApplicationApi = async () => {
  const response = await api.get('/membership/applications/student')
  return response.data
}

export const getStudentApplicationDocumentApi = async (id) => {
  const response = await api.get(`/admin/applications/${id}/student-document`, { responseType: 'blob' })
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

export const resubmitApplicationClarificationApi = async (id, data) => {
  const response = await api.patch(`/membership/applications/me/${id}/clarification`, data)
  return response.data
}

export const resubmitStudentClarificationApi = async (id, data) => {
  const response = await api.patch(`/membership/applications/student/${id}/clarification`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
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

