import api from './api'

export const createPaymentApi = async (paymentData) => {
  const response = await api.post('/payments', paymentData)
  return response.data
}

export const submitPaymentDetailsApi = async (id, submissionData) => {
  const response = await api.post(`/payments/${id}/submit`, submissionData)
  return response.data
}

export const getMyPaymentsApi = async () => {
  const response = await api.get('/payments/my')
  return response.data
}

export const getInvoiceByIdApi = async (id) => {
  const response = await api.get(`/invoices/${id}`)
  return response.data
}

export const getAdminPaymentsApi = async (params) => {
  const response = await api.get('/admin/payments', { params })
  return response.data
}

export const getAdminPaymentByIdApi = async (id) => {
  const response = await api.get(`/admin/payments/${id}`)
  return response.data
}

export const verifyPaymentApi = async (id, data) => {
  const response = await api.patch(`/admin/payments/${id}/verify`, data)
  return response.data
}

export const rejectPaymentApi = async (id, data) => {
  const response = await api.patch(`/admin/payments/${id}/reject`, data)
  return response.data
}

export const refundPaymentApi = async (id, data) => {
  const response = await api.patch(`/admin/payments/${id}/refund`, data)
  return response.data
}

export const createComplimentaryPaymentApi = async (data) => {
  const response = await api.post('/admin/payments/complimentary', data)
  return response.data
}
