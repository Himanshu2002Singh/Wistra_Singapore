import api from './api'

export const getAdminEventsApi = async () => (await api.get('/admin/content/events')).data
export const createAdminEventApi = async (data) => (await api.post('/admin/content/events', data)).data
export const updateAdminEventApi = async (id, data) => (await api.patch(`/admin/content/events/${id}`, data)).data
export const getAdminEventRegistrationsApi = async (id) => (await api.get(`/admin/content/events/${id}/registrations`)).data
export const checkInEventApi = async (event_id, ticket_uid) => (await api.post('/admin/content/events/check-in', { event_id, ticket_uid })).data
export const uploadAdminEventImageApi = async (file) => {
  const body = new FormData()
  body.append('image', file)
  return (await api.post('/admin/content/events/images', body)).data
}
export const getAdminNewsApi = async () => (await api.get('/admin/content/news')).data
export const uploadAdminNewsImageApi = async (file) => {
  const body = new FormData()
  body.append('image', file)
  return (await api.post('/admin/content/news/images', body)).data
}
export const resolveNewsImageUrl = (value) => {
  if (typeof value !== 'string' || !value.startsWith('/content/news/images/')) return value || ''
  const baseUrl = String(api.defaults.baseURL || '/api').replace(/\/+$/, '')
  return `${baseUrl}${value}`
}
export const createAdminNewsApi = async (data) => (await api.post('/admin/content/news', data)).data
export const updateAdminNewsApi = async (id, data) => (await api.patch(`/admin/content/news/${id}`, data)).data
export const setAdminNewsPublicationApi = async (id, status) => (await api.patch(`/admin/content/news/${id}/publication`, { status })).data
export const deleteAdminNewsApi = async (id) => (await api.delete(`/admin/content/news/${id}`)).data
