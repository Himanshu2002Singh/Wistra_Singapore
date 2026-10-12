import api from './api'

export const getPublishedEventsApi = async () => (await api.get('/content/events')).data
export const getPublishedNewsApi = async () => (await api.get('/content/news')).data
