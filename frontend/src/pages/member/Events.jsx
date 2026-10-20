import React, { useCallback, useEffect, useMemo, useState } from 'react'
import MemberLayout from '@/components/member/MemberLayout'
import { AlertCircle, Calendar, CheckCircle2, Clock3, MapPin, RefreshCw, Ticket } from 'lucide-react'
import { getMyEventRegistrationsApi, registerForEventApi } from '@/services/eventService'
import { getPublishedEventApi, getPublishedEventsApi } from '@/services/publicContentService'

const formatDate = (value, options = { dateStyle: 'medium', timeStyle: 'short' }) => {
  if (!value) return 'Time to be announced'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Time to be announced'
    : new Intl.DateTimeFormat('en-SG', { ...options, timeZone: 'Asia/Singapore' }).format(date)
}

const eventIsPast = (event) => new Date(event.starts_at).getTime() < Date.now()

const Events = () => {
  const [activeTab, setActiveTab] = useState('upcoming')
  const [events, setEvents] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [error, setError] = useState('')
  const [historyError, setHistoryError] = useState('')
  const [registeringId, setRegisteringId] = useState(null)
  const [notice, setNotice] = useState('')
  const [registrationError, setRegistrationError] = useState('')
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [eventDetails, setEventDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')

  const loadEvents = useCallback(async () => {
    const [eventResult, registrationResult] = await Promise.allSettled([
      getPublishedEventsApi(),
      getMyEventRegistrationsApi(),
    ])
    if (eventResult.status === 'fulfilled' && eventResult.value?.success) {
      setEvents(Array.isArray(eventResult.value.data?.events) ? eventResult.value.data.events : [])
    } else {
      setEvents([])
      setError(eventResult.status === 'rejected'
        ? (eventResult.reason.response?.data?.message || 'Published events could not be loaded. Please try again.')
        : 'Published events could not be loaded. Please try again.')
    }
    if (registrationResult.status === 'fulfilled' && registrationResult.value?.success) {
      setRegistrations(Array.isArray(registrationResult.value.data?.registrations) ? registrationResult.value.data.registrations : [])
    } else {
      setRegistrations([])
      setHistoryError(registrationResult.status === 'rejected'
        ? (registrationResult.reason.response?.data?.message || 'Your registration history could not be loaded.')
        : 'Your registration history could not be loaded.')
    }
    setLoading(false)
    setHistoryLoading(false)
  }, [])

  const refreshEvents = () => {
    setLoading(true)
    setHistoryLoading(true)
    setError('')
    setHistoryError('')
    loadEvents()
  }

  useEffect(() => { loadEvents() }, [loadEvents])

  const registeredEventIds = useMemo(() => new Set(registrations.map(({ event_id }) => String(event_id))), [registrations])
  const upcomingEvents = events.filter((event) => !eventIsPast(event)).sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
  const pastEvents = events.filter(eventIsPast).sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at))
  const visibleEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents

  const toggleDetails = async (eventId) => {
    if (selectedEventId === String(eventId)) {
      setSelectedEventId(null)
      setEventDetails(null)
      return
    }
    setSelectedEventId(String(eventId))
    setEventDetails(null)
    setDetailsError('')
    setDetailsLoading(true)
    try {
      const result = await getPublishedEventApi(eventId)
      if (!result?.success || !result.data?.event) throw new Error('Event details could not be loaded.')
      setEventDetails(result.data.event)
    } catch (detailError) {
      setDetailsError(detailError.response?.data?.message || detailError.message || 'Event details could not be loaded.')
    } finally {
      setDetailsLoading(false)
    }
  }

  const register = async (event) => {
    if (registeringId !== null || registeredEventIds.has(String(event.id)) || eventIsPast(event)) return
    setRegisteringId(String(event.id))
    setNotice('')
    setRegistrationError('')
    try {
      const result = await registerForEventApi(event.id)
      if (!result?.success || !result.data?.registration) throw new Error(result?.message || 'Registration could not be completed.')
      setRegistrations((current) => [{ ...result.data.registration, event }, ...current])
      setNotice(result.message || `Registration for ${event.title} was created.`)
    } catch (registrationError) {
      if (registrationError.response?.data?.code === 'ALREADY_REGISTERED') {
        setNotice(`You are already registered for ${event.title}.`)
        await loadEvents()
      } else {
        setRegistrationError(registrationError.response?.data?.message || registrationError.message || 'Registration could not be completed. Please try again.')
      }
    } finally {
      setRegisteringId(null)
    }
  }

  return (
    <MemberLayout>
      <div className="space-y-8 pb-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2 text-[#5ee5e9] text-xs font-bold tracking-[0.2em] uppercase mb-1">
              <Calendar size={14} />
              <span>EVENTS &amp; SESSIONS</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-[var(--serif)] font-normal text-white">Member Events</h1>
            <p className="text-sm text-slate-300">Browse published WISTA events and manage your registrations.</p>
          </div>
        <button type="button" onClick={refreshEvents} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-slate-200 text-xs font-bold tracking-widest uppercase rounded-md hover:border-[#5ee5e9]/50 disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {notice && <div role="status" className="rounded-lg border border-[#5ee5e9]/30 bg-[#5ee5e9]/10 p-4 text-sm text-[#b9fbfd]">{notice}</div>}
        {registrationError && <div role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200 flex items-center gap-2"><AlertCircle size={16} />{registrationError}</div>}
        {error && <div role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200 flex items-center justify-between gap-4"><span className="flex items-center gap-2"><AlertCircle size={16} />{error}</span><button type="button" onClick={refreshEvents} className="font-semibold underline">Retry</button></div>}

        <div className="flex border-b border-white/10">
          {['upcoming', 'past'].map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} aria-pressed={activeTab === tab} className={`px-6 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition cursor-pointer ${activeTab === tab ? 'border-[#e85d4a] text-white bg-white/5' : 'border-transparent text-slate-400 hover:text-white'}`}>
            {tab === 'upcoming' ? 'Upcoming Events' : 'Past Events'}
          </button>)}
        </div>

        <section aria-label={activeTab === 'upcoming' ? 'Upcoming events' : 'Past events'} className="space-y-4">
          {loading && <div role="status" className="bg-[#0c243b] border border-white/10 rounded-2xl p-8 text-center text-sm text-slate-300">Loading published events…</div>}
          {!loading && !error && visibleEvents.map((event) => {
            const eventId = String(event.id)
            const registered = registeredEventIds.has(eventId)
            const detailIsOpen = selectedEventId === eventId
            return <article key={eventId} className="bg-[#0c243b] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-[150px_1fr_auto] gap-5 p-5 sm:p-6 items-start">
                <div className="rounded-xl border border-[#5ee5e9]/20 bg-[#5ee5e9]/5 p-4 text-center">
                  <Calendar size={20} className="mx-auto mb-2 text-[#5ee5e9]" />
                  <time dateTime={event.starts_at} className="text-xs font-semibold text-white">{formatDate(event.starts_at, { day: 'numeric', month: 'short', year: 'numeric' })}</time>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">{formatDate(event.starts_at, { hour: 'numeric', minute: '2-digit' })}</p>
                </div>
                <div className="min-w-0 space-y-3">
                  <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#5ee5e9]">{event.event_type}</p>
                  <h2 className="font-[var(--serif)] text-2xl text-white">{event.title}</h2>
                  <p className="line-clamp-3 text-sm leading-relaxed text-slate-300">{event.description}</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1.5"><MapPin size={13} />{event.location}</span>
                    <span>{event.is_free ? 'Free' : `Member SGD ${Number(event.member_price).toFixed(2)} · Guest SGD ${Number(event.non_member_price).toFixed(2)}`}</span>
                    {event.ends_at && <span className="inline-flex items-center gap-1.5"><Clock3 size={13} />Ends {formatDate(event.ends_at)}</span>}
                  </div>
                  <button type="button" onClick={() => toggleDetails(event.id)} className="text-xs font-bold uppercase tracking-wider text-[#5ee5e9] hover:text-white">{detailIsOpen ? 'Hide details' : 'View details'}</button>
                  {detailIsOpen && <div className="rounded-lg border border-white/10 bg-[#071626]/70 p-4 text-sm text-slate-300" aria-live="polite">
                    {detailsLoading && 'Loading event details…'}
                    {detailsError && <span className="text-red-200">{detailsError}</span>}
                    {eventDetails && <><p className="leading-relaxed">{eventDetails.description}</p><p className="mt-3 text-xs text-slate-400">{formatDate(eventDetails.starts_at)}{eventDetails.ends_at ? ` – ${formatDate(eventDetails.ends_at)}` : ''} · {eventDetails.location}</p></>}
                  </div>}
                </div>
                <div className="md:min-w-40 md:text-right">
                  {registered
                    ? <span className="inline-flex items-center gap-2 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-emerald-200"><CheckCircle2 size={14} />Registered</span>
                    : eventIsPast(event)
                      ? <span className="inline-flex rounded-md border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Event ended</span>
                      : <button type="button" onClick={() => register(event)} disabled={registeringId !== null} className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--coral)] px-4 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#f27663] disabled:cursor-wait disabled:opacity-60">
                        <Ticket size={14} />{registeringId === eventId ? 'Registering…' : 'Register'}
                      </button>}
                </div>
              </div>
            </article>
          })}
          {!loading && !error && !visibleEvents.length && <div className="bg-[#0c243b] border border-white/10 rounded-2xl p-10 text-center">
            <Calendar size={22} className="mx-auto mb-3 text-[#5ee5e9]" />
            <h2 className="font-[var(--serif)] text-2xl text-white">{activeTab === 'upcoming' ? 'No upcoming events' : 'No past events'}</h2>
            <p className="mt-2 text-sm text-slate-300">{activeTab === 'upcoming' ? 'Published events will appear here when they are announced.' : 'Published past events will appear here.'}</p>
          </div>}
        </section>

        <section aria-labelledby="registration-history-heading" className="space-y-4 pt-5">
          <div className="flex items-center gap-3 border-b border-white/10 pb-3">
            <Ticket size={17} className="text-[#5ee5e9]" />
            <h2 id="registration-history-heading" className="font-[var(--serif)] text-2xl text-white">My Registration History</h2>
          </div>
          {historyLoading && <p role="status" className="text-sm text-slate-300">Loading your registrations…</p>}
          {historyError && <div role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{historyError}<button type="button" onClick={refreshEvents} className="ml-3 font-semibold underline">Retry</button></div>}
          {!historyLoading && !historyError && !registrations.length && <p className="rounded-xl border border-white/10 bg-[#0c243b] p-6 text-sm text-slate-300">You have not registered for an event yet.</p>}
          {!historyLoading && !historyError && registrations.map((registration) => <article key={registration.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#0c243b] p-5">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5ee5e9]">{registration.event?.event_type || 'Event'}</p><h3 className="mt-1 font-[var(--serif)] text-xl text-white">{registration.event?.title || 'Event details unavailable'}</h3><p className="mt-1 text-xs text-slate-400">{registration.event?.starts_at ? formatDate(registration.event.starts_at) : 'Date unavailable'}{registration.event?.location ? ` · ${registration.event.location}` : ''}</p></div>
            <div className="sm:text-right"><span className="inline-flex rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-emerald-200">{registration.payment_status || registration.status}</span>{registration.payment_status === 'PAID' && registration.ticket_uid && <p className="mt-2 font-mono text-[11px] text-[#5ee5e9]">Entry ticket: {registration.ticket_uid}</p>}{registration.status === 'AWAITING_PAYMENT' && <p className="mt-2 text-[11px] text-amber-200">Complete payment in My Payments to confirm entry.</p>}<p className="mt-2 text-[11px] text-slate-400">Registered {formatDate(registration.created_at)}</p></div>
          </article>)}
        </section>
      </div>
    </MemberLayout>
  )
}

export default Events
