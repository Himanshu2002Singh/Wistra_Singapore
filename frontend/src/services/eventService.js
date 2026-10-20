import api from './api'

export const getMyEventRegistrationsApi = async () => (await api.get('/membership/events/registrations/me')).data
export const registerForEventApi = async (eventId) => (await api.post(`/membership/events/${eventId}/registrations`)).data
