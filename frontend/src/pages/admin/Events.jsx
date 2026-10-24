import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, Plus, X } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/context/AuthContext'
import { createAdminEventApi, updateAdminEventApi, getAdminEventsApi, getAdminEventRegistrationsApi, checkInEventApi, uploadAdminEventImageApi, resolveNewsImageUrl } from '@/services/adminContentService'

const can = (user, permissions) => (user?.role?.name || user?.role) === 'SUPER_ADMIN' || permissions.some((item) => user?.permissions?.includes(item))
const eventDate = (value) => value ? new Date(value).toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
const initialForm = { title: '', description: '', event_type: '', location: '', image_url: '', format: 'IN_PERSON', starts_at: '', ends_at: '', registration_opens_at: '', registration_closes_at: '', capacity: '', status: 'DRAFT', is_free: true, member_price: '', currency: 'SGD' }

export default function Events() {
  const { user } = useAuth()
  const canCreate = can(user, ['events.create', 'events.manage'])
  const canReviewRegistrations = can(user, ['events.manage_registrations', 'events.read', 'events.manage'])
  const canCheckIn = can(user, ['events.checkin', 'attendance.manage', 'events.manage'])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [open, setOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [saving, setSaving] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState('')
  const [form, setForm] = useState(initialForm)
  const [selectedRegistrations, setSelectedRegistrations] = useState(null)
  const [registrationsLoading, setRegistrationsLoading] = useState(false)
  const [ticketUid, setTicketUid] = useState('')
  const [checkInMessage, setCheckInMessage] = useState('')
  const [registrationSearch, setRegistrationSearch] = useState('')
  const [registrationStatus, setRegistrationStatus] = useState('ALL')

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

  useEffect(() => {
    if (!open) return undefined
    const root = document.documentElement
    const adminContent = document.querySelector('.admin-main-content')
    const previousBodyOverflow = document.body.style.overflow
    const previousRootOverflow = root.style.overflow
    const previousAdminContentOverflow = adminContent?.style.overflowY
    document.body.style.overflow = 'hidden'
    root.style.overflow = 'hidden'
    if (adminContent) adminContent.style.overflowY = 'hidden'
    return () => {
      document.body.style.overflow = previousBodyOverflow
      root.style.overflow = previousRootOverflow
      if (adminContent) adminContent.style.overflowY = previousAdminContentOverflow
    }
  }, [open])

  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    setSaving(true); setError(''); setNotice('')
    try {
      const values = { ...form, starts_at: new Date(form.starts_at).toISOString(), ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null, registration_opens_at: form.registration_opens_at ? new Date(form.registration_opens_at).toISOString() : null, registration_closes_at: form.registration_closes_at ? new Date(form.registration_closes_at).toISOString() : null, capacity: form.capacity || null, member_price: form.is_free ? null : Number(form.member_price) }
      const result = editingEvent ? await updateAdminEventApi(editingEvent.id, values) : await createAdminEventApi(values)
      setNotice(result?.message || (editingEvent ? 'Event updated.' : 'Event created.'))
      setForm(initialForm); setEditingEvent(null); setImagePreview(''); setOpen(false)
      await loadEvents()
    } catch (err) { setError(err.response?.data?.message || (!err.response ? 'The Events API could not be reached.' : 'Event could not be created.')) }
    finally { setSaving(false) }
  }

  const editEvent = (item) => {
    const localValue = (value) => value ? new Date(value).toISOString().slice(0, 16) : ''
    setError('')
    setEditingEvent(item)
    setForm({ title: item.title || '', description: item.description || '', event_type: item.event_type || '', location: item.location || '', image_url: item.image_url || '', format: item.format || 'IN_PERSON', starts_at: localValue(item.starts_at), ends_at: localValue(item.ends_at), registration_opens_at: localValue(item.registration_opens_at), registration_closes_at: localValue(item.registration_closes_at), capacity: item.capacity ?? '', status: item.status || 'DRAFT', is_free: Boolean(item.is_free), member_price: item.member_price || '', currency: item.currency || 'SGD' })
    setImagePreview(resolveNewsImageUrl(item.image_url))
    setOpen(true)
  }

  const openCreate = () => {
    setEditingEvent(null)
    setForm(initialForm)
    setImagePreview('')
    setError('')
    setOpen(true)
  }

  const uploadImage = async (event) => {
    const input = event.currentTarget
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPEG, PNG, or WebP image.')
      input.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image files must be 5 MB or smaller.')
      input.value = ''
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
    setImageUploading(true)
    setError('')
    try {
      const result = await uploadAdminEventImageApi(file)
      const imageUrl = result?.data?.image_url
      if (!imageUrl) throw new Error('The image upload did not return an image URL.')
      setForm((current) => ({ ...current, image_url: imageUrl }))
      setImagePreview(previewUrl)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'The image could not be uploaded.')
      setForm((current) => ({ ...current, image_url: '' }))
      setImagePreview('')
      input.value = ''
    } finally {
      setImageUploading(false)
    }
  }

  const openRegistrations = async (item) => {
    setSelectedRegistrations({ event: item, rows: [] }); setRegistrationsLoading(true); setCheckInMessage(''); setRegistrationSearch(''); setRegistrationStatus('ALL')
    try { const result = await getAdminEventRegistrationsApi(item.id); setSelectedRegistrations({ event: item, rows: result?.data?.registrations || [] }) }
    catch (err) { setError(err.response?.data?.message || 'Event registrations could not be loaded.') }
    finally { setRegistrationsLoading(false) }
  }

  const submitCheckIn = async (event) => {
    event.preventDefault()
    try { const result = await checkInEventApi(selectedRegistrations.event.id, ticketUid.trim()); setCheckInMessage(result?.message || 'Attendee checked in.'); setTicketUid(''); if (selectedRegistrations) await openRegistrations(selectedRegistrations.event) }
    catch (err) { setCheckInMessage(err.response?.data?.message || 'Ticket could not be checked in.') }
  }

  return <AdminLayout><div className="admin-sample-module admin-content-module">
    <div className="admin-sample-title"><div><p className="admin-kicker"><span /> Admin workspace</p><h1>Events</h1><p>Create and manage the event programme.</p></div>{canCreate && <button type="button" className="admin-sample-primary" onClick={openCreate}><Plus size={15} /> Add Event</button>}</div>
    {notice && <div className="admin-sample-notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss message"><X size={16} /></button></div>}
    {error && !open && <div className="admin-payment-error" role="alert">{error}<button type="button" onClick={loadEvents}>Try again</button></div>}
    <div className="admin-sample-controls"><span>{events.length} saved event{events.length === 1 ? '' : 's'}</span></div>
    <div className="admin-sample-table-wrap"><table className="admin-sample-table"><thead><tr><th>Event</th><th>Type</th><th>Location</th><th>Starts</th><th>Price</th><th>Capacity</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {loading ? <tr><td colSpan="8" className="admin-sample-empty" role="status">Loading events…</td></tr> : events.length ? events.map((item) => <tr key={item.id}><td data-label="Event"><strong>{item.title}</strong><p className="admin-content-excerpt">{item.description}</p></td><td data-label="Type">{item.event_type} · {item.format?.replace('_', ' ')}</td><td data-label="Location">{item.location}</td><td data-label="Starts">{eventDate(item.starts_at)}</td><td data-label="Price">{item.is_free ? 'Free' : `${item.currency || 'SGD'} ${Number(item.member_price).toFixed(2)}`}</td><td data-label="Capacity">{item.registration_count || 0}{item.capacity ? ` / ${item.capacity}` : ' / Unlimited'}</td><td data-label="Status"><span className={`admin-sample-status status-${item.status.toLowerCase()}`}>{item.status}</span></td><td>{canCreate && <button type="button" className="admin-sample-view" onClick={() => editEvent(item)}>Edit</button>} {canReviewRegistrations && <button type="button" className="admin-sample-view" onClick={() => openRegistrations(item)}>Registrations</button>}</td></tr>) : <tr><td colSpan="8" className="admin-sample-empty"><CalendarDays size={23} /><h2>No events have been added</h2><p>Create an event to start building the programme.</p></td></tr>}
    </tbody></table></div>
    {!canCreate && <p className="admin-content-help">Your role can view events but cannot create them.</p>}
    {selectedRegistrations && <div className="admin-sample-modal" role="dialog" aria-modal="true" aria-label="Event registrations"><div><button type="button" className="admin-sample-modal-close" onClick={() => setSelectedRegistrations(null)} aria-label="Close registrations"><X size={18} /></button><p className="admin-kicker"><span /> Event attendance</p><h2>{selectedRegistrations.event.title} registrations</h2>{checkInMessage && <div className="admin-sample-notice" role="status">{checkInMessage}</div>}{canCheckIn && <form className="admin-content-form" onSubmit={submitCheckIn}><label>Ticket UID<input value={ticketUid} onChange={(event) => setTicketUid(event.target.value)} maxLength={64} required /></label><button type="submit">Check in attendee</button></form>}{!registrationsLoading && <div className="admin-content-form"><label>Search registrations<input type="search" value={registrationSearch} onChange={(event) => setRegistrationSearch(event.target.value)} placeholder="Name, email, or ticket UID" /></label><label>Payment status<select value={registrationStatus} onChange={(event) => setRegistrationStatus(event.target.value)}><option value="ALL">All registrations</option><option value="AWAITING_PAYMENT">Awaiting payment</option><option value="SUBMITTED">Submitted</option><option value="PAID">Paid</option><option value="NOT_REQUIRED">Free / confirmed</option><option value="REJECTED">Rejected</option></select></label></div>}{registrationsLoading ? <p role="status">Loading registrations…</p> : <div className="admin-sample-table-wrap"><table className="admin-sample-table"><thead><tr><th>Member</th><th>Email</th><th>Registered</th><th>Payment</th><th>Ticket</th><th>Checked in</th></tr></thead><tbody>{selectedRegistrations.rows.filter((row) => (registrationStatus === 'ALL' || row.payment_status === registrationStatus) && `${row.member?.first_name || ''} ${row.member?.last_name || ''} ${row.member?.email || ''} ${row.ticket_uid || ''}`.toLowerCase().includes(registrationSearch.toLowerCase())).map((row) => <tr key={row.id}><td>{[row.member?.first_name, row.member?.last_name].filter(Boolean).join(' ') || '—'}</td><td>{row.member?.email || '—'}</td><td>{eventDate(row.created_at)}</td><td>{row.payment_status}</td><td>{row.ticket_uid || 'Pending payment'}</td><td>{row.checked_in_at ? `${eventDate(row.checked_in_at)}${row.checkedInBy ? ` · ${[row.checkedInBy.first_name, row.checkedInBy.last_name].filter(Boolean).join(' ') || row.checkedInBy.email}` : ''}` : 'No'}</td></tr>)}</tbody></table></div>}</div></div>}
    {open && <div className="admin-sample-modal admin-event-modal" role="dialog" aria-modal="true" aria-labelledby="create-event-title"><div><button type="button" className="admin-sample-modal-close" onClick={() => !saving && !imageUploading && setOpen(false)} aria-label="Close form" disabled={saving || imageUploading}><X size={18} /></button><p className="admin-kicker"><span /> Events</p><h2 id="create-event-title">{editingEvent ? 'Edit Event' : 'Add Event'}</h2>
      {error && <div className="admin-payment-error" role="alert">{error}</div>}
      <form className="admin-content-form" onSubmit={submit}>
        <label>Event name<input required maxLength={180} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
        <label>Event type<input required maxLength={80} value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} placeholder="AGM, Gala, Forum…" /></label>
        <label>Location<input required maxLength={255} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
        <label>Event image file <span>(optional; JPEG, PNG, or WebP, up to 5 MB)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} disabled={imageUploading || saving} /></label>
        {imagePreview && <div className="admin-news-image-preview"><span>Image preview</span><img src={imagePreview} alt="Event preview" />{imageUploading && <small role="status">Uploading image…</small>}</div>}
        <label>Format<select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}><option value="IN_PERSON">In person</option><option value="ONLINE">Online</option><option value="HYBRID">Hybrid</option></select></label>
        <label>Start date and time<input type="datetime-local" required value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></label>
        <label>End date and time <span>(optional)</span><input type="datetime-local" value={form.ends_at} min={form.starts_at || undefined} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></label>
        <label>Registration opens <span>(optional)</span><input type="datetime-local" value={form.registration_opens_at} onChange={(e) => setForm({ ...form, registration_opens_at: e.target.value })} /></label>
        <label>Registration closes <span>(optional; defaults to event start)</span><input type="datetime-local" value={form.registration_closes_at} onChange={(e) => setForm({ ...form, registration_closes_at: e.target.value })} /></label>
        <label>Maximum registrations <span>(optional; blank means unlimited)</span><input type="number" min="1" step="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></label>
        <label>Description<textarea required maxLength={10000} rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <label>Pricing<select value={form.is_free ? 'free' : 'paid'} onChange={(e) => setForm({ ...form, is_free: e.target.value === 'free' })}><option value="free">Free event</option><option value="paid">Paid event</option></select></label>
        {!form.is_free && <label>Member price (SGD)<input type="number" min="0.01" step="0.01" required value={form.member_price} onChange={(e) => setForm({ ...form, member_price: e.target.value })} /></label>}
        <label>Visibility<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="DRAFT">Draft / unpublished</option><option value="PUBLISHED">Published</option><option value="CANCELLED">Cancelled</option></select></label>
        <div className="admin-sample-modal-actions"><button type="button" onClick={() => { setOpen(false); setEditingEvent(null); setForm(initialForm); setImagePreview('') }} disabled={saving || imageUploading}>Cancel</button><button type="submit" disabled={saving || imageUploading}>{saving ? 'Saving…' : imageUploading ? 'Uploading image…' : editingEvent ? 'Update Event' : 'Save Event'}</button></div>
      </form>
    </div></div>}
  </div></AdminLayout>
}
