import api from './api'

export const getPublishedEventsApi = async () => (await api.get('/content/events')).data
export const getPublishedEventApi = async (id) => (await api.get(`/content/events/${id}`)).data
export const getPublishedNewsApi = async () => (await api.get('/content/news')).data
export const getPublishedNewsArticleApi = async (id) => (await api.get(`/content/news/${id}`)).data
