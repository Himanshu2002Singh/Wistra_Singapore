import api from './api'

export const getAdminReportApi = async (type, params = {}) => {
  const response = await api.get(`/admin/reports/${type}`, { params })
  return response.data
}

export const exportAdminReportCsvApi = async (type, params = {}) => {
  const response = await api.get(`/admin/reports/${type}/export`, { params, responseType: 'blob' })
  return response.data
}
