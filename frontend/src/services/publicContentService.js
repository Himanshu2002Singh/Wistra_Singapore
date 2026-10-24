import api from './api'

export const resolveContentImageUrl = (value) => {
  if (typeof value !== 'string' || !value.startsWith('/content/news/images/')) return value || ''
  const baseUrl = String(api.defaults.baseURL || '/api').replace(/\/+$/, '')
  return `${baseUrl}${value}`
}

export const getPublishedEventsApi = async () => (await api.get('/content/events')).data
export const getPublishedEventApi = async (id) => (await api.get(`/content/events/${id}`)).data
export const getPublishedNewsApi = async () => (await api.get('/content/news')).data
export const getPublishedNewsArticleApi = async (id) => (await api.get(`/content/news/${id}`)).data
