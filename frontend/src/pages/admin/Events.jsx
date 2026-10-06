import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, Plus, X } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/context/AuthContext'
import { createAdminEventApi, getAdminEventsApi } from '@/services/adminContentService'

const can = (user, permissions) => (user?.role?.name || user?.role) === 'SUPER_ADMIN' || permissions.some((item) => user?.permissions?.includes(item))
const eventDate = (value) => value ? new Date(value).toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
const initialForm = { title: '', description: '', event_type: '', location: '', starts_at: '', ends_at: '', status: 'DRAFT' }

export default function Events() {
  const { user } = useAuth()
  const canCreate = can(user, ['events.create', 'events.manage'])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(initialForm)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError('')
    try { const result = await getAdminEventsApi(); setEvents(Array.isArray(result?.data) ? result.data : []) }
    catch (err) { setError(err.response?.data?.message || (!err.response ? 'Events could not be loaded. Check the backend connection.' : 'Events could not be loaded.')) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    let active = true
    getAdminEventsApi().then((result) => {
      if (active) setEvents(Array.isArray(result?.data) ? result.data : [])
    }).catch((err) => {
      if (active) setError(err.response?.data?.message || (!err.response ? 'Events could not be loaded. Check the backend connection.' : 'Events could not be loaded.'))
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    setSaving(true); setError(''); setNotice('')
    try {
      const result = await createAdminEventApi({ ...form, starts_at: new Date(form.starts_at).toISOString(), ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null })
      setNotice(result?.message || 'Event created.')
      setForm(initialForm); setOpen(false)
      await loadEvents()
    } catch (err) { setError(err.response?.data?.message || (!err.response ? 'The Events API could not be reached.' : 'Event could not be created.')) }
    finally { setSaving(false) }
  }

  return <AdminLayout><div className="admin-sample-module admin-content-module">
    <div className="admin-sample-title"><div><p className="admin-kicker"><span /> Admin workspace</p><h1>Events</h1><p>Create and manage the event programme.</p></div>{canCreate && <button type="button" className="admin-sample-primary" onClick={() => { setError(''); setOpen(true) }}><Plus size={15} /> Add Event</button>}</div>
    {notice && <div className="admin-sample-notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss message"><X size={16} /></button></div>}
    {error && !open && <div className="admin-payment-error" role="alert">{error}<button type="button" onClick={loadEvents}>Try again</button></div>}
    <div className="admin-sample-controls"><span>{events.length} saved event{events.length === 1 ? '' : 's'}</span></div>
    <div className="admin-sample-table-wrap"><table className="admin-sample-table"><thead><tr><th>Event</th><th>Type</th><th>Location</th><th>Starts</th><th>Status</th></tr></thead><tbody>
      {loading ? <tr><td colSpan="5" className="admin-sample-empty" role="status">Loading events…</td></tr> : events.length ? events.map((item) => <tr key={item.id}><td data-label="Event"><strong>{item.title}</strong><p className="admin-content-excerpt">{item.description}</p></td><td data-label="Type">{item.event_type}</td><td data-label="Location">{item.location}</td><td data-label="Starts">{eventDate(item.starts_at)}</td><td data-label="Status"><span className={`admin-sample-status status-${item.status.toLowerCase()}`}>{item.status}</span></td></tr>) : <tr><td colSpan="5" className="admin-sample-empty"><CalendarDays size={23} /><h2>No events have been added</h2><p>Create an event to start building the programme.</p></td></tr>}
    </tbody></table></div>
    {!canCreate && <p className="admin-content-help">Your role can view events but cannot create them.</p>}
    {open && <div className="admin-sample-modal" role="dialog" aria-modal="true" aria-labelledby="create-event-title"><div><button type="button" className="admin-sample-modal-close" onClick={() => !saving && setOpen(false)} aria-label="Close form" disabled={saving}><X size={18} /></button><p className="admin-kicker"><span /> Events</p><h2 id="create-event-title">Add Event</h2>
      {error && <div className="admin-payment-error" role="alert">{error}</div>}
      <form className="admin-content-form" onSubmit={submit}>
        <label>Event name<input required maxLength={180} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
        <label>Event type<input required maxLength={80} value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} placeholder="AGM, Gala, Forum…" /></label>
        <label>Location<input required maxLength={255} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
        <label>Start date and time<input type="datetime-local" required value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></label>
        <label>End date and time <span>(optional)</span><input type="datetime-local" value={form.ends_at} min={form.starts_at || undefined} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></label>
        <label>Description<textarea required maxLength={10000} rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <label>Visibility<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select></label>
        <div className="admin-sample-modal-actions"><button type="button" onClick={() => setOpen(false)} disabled={saving}>Cancel</button><button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Event'}</button></div>
      </form>
    </div></div>}
  </div></AdminLayout>
}
