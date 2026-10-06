import api from './api'

export const getAdminEventsApi = async () => (await api.get('/admin/content/events')).data
export const createAdminEventApi = async (data) => (await api.post('/admin/content/events', data)).data
export const getAdminNewsApi = async () => (await api.get('/admin/content/news')).data
export const createAdminNewsApi = async (data) => (await api.post('/admin/content/news', data)).data
