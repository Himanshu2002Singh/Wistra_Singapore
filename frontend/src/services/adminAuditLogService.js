import api from './api'

export const getAdminAuditLogsApi = async (params) => {
  const response = await api.get('/admin/audit-logs', { params })
  return response.data
}

export const getAdminAuditLogByIdApi = async (id) => {
  const response = await api.get(`/admin/audit-logs/${id}`)
  return response.data
}
