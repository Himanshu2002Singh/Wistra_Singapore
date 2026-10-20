import api from './api'

export const submitContactMessageApi = async (message) => {
  const response = await api.post('/contact', message)
  return response.data
}
