import { useCallback, useEffect, useState } from 'react'
import { Newspaper, Plus, X } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/context/AuthContext'
import { createAdminNewsApi, getAdminNewsApi } from '@/services/adminContentService'

const can = (user, permissions) => (user?.role?.name || user?.role) === 'SUPER_ADMIN' || permissions.some((item) => user?.permissions?.includes(item))
const dateValue = (value) => value ? new Date(value).toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const initialForm = { title: '', excerpt: '', content: '', category: '', author: '', image_url: '', status: 'DRAFT' }

export default function Communications() {
  const { user } = useAuth()
  const canCreate = can(user, ['news.create', 'news.manage'])
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(initialForm)

  const loadNews = useCallback(async () => {
    setLoading(true); setError('')
    try { const result = await getAdminNewsApi(); setArticles(Array.isArray(result?.data) ? result.data : []) }
    catch (err) { setError(err.response?.data?.message || (!err.response ? 'News could not be loaded. Check the backend connection.' : 'News could not be loaded.')) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    let active = true
    getAdminNewsApi().then((result) => {
      if (active) setArticles(Array.isArray(result?.data) ? result.data : [])
    }).catch((err) => {
      if (active) setError(err.response?.data?.message || (!err.response ? 'News could not be loaded. Check the backend connection.' : 'News could not be loaded.'))
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    setSaving(true); setError(''); setNotice('')
    try {
      const result = await createAdminNewsApi({ ...form, image_url: form.image_url.trim() || null })
      setNotice(result?.message || 'News article created.')
      setForm(initialForm); setOpen(false)
      await loadNews()
    } catch (err) { setError(err.response?.data?.message || (!err.response ? 'The News API could not be reached.' : 'News article could not be created.')) }
    finally { setSaving(false) }
  }

  return <AdminLayout><div className="admin-sample-module admin-content-module">
    <div className="admin-sample-title"><div><p className="admin-kicker"><span /> Admin workspace</p><h1>News</h1><p>Create and manage WISTA Singapore news and stories.</p></div>{canCreate && <button type="button" className="admin-sample-primary" onClick={() => { setError(''); setOpen(true) }}><Plus size={15} /> Add News</button>}</div>
    {notice && <div className="admin-sample-notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss message"><X size={16} /></button></div>}
    {error && !open && <div className="admin-payment-error" role="alert">{error}<button type="button" onClick={loadNews}>Try again</button></div>}
    <div className="admin-sample-controls"><span>{articles.length} saved article{articles.length === 1 ? '' : 's'}</span></div>
    <div className="admin-sample-table-wrap"><table className="admin-sample-table"><thead><tr><th>Article</th><th>Category</th><th>Author</th><th>Status</th><th>Published</th></tr></thead><tbody>
      {loading ? <tr><td colSpan="5" className="admin-sample-empty" role="status">Loading news…</td></tr> : articles.length ? articles.map((item) => <tr key={item.id}><td data-label="Article"><strong>{item.title}</strong><p className="admin-content-excerpt">{item.excerpt}</p></td><td data-label="Category">{item.category}</td><td data-label="Author">{item.author}</td><td data-label="Status"><span className={`admin-sample-status status-${item.status.toLowerCase()}`}>{item.status}</span></td><td data-label="Published">{dateValue(item.published_at)}</td></tr>) : <tr><td colSpan="5" className="admin-sample-empty"><Newspaper size={23} /><h2>No news articles have been added</h2><p>Create an article to start the news archive.</p></td></tr>}
    </tbody></table></div>
    {!canCreate && <p className="admin-content-help">Your role can view news but cannot create articles.</p>}
    {open && <div className="admin-sample-modal" role="dialog" aria-modal="true" aria-labelledby="create-news-title"><div><button type="button" className="admin-sample-modal-close" onClick={() => !saving && setOpen(false)} aria-label="Close form" disabled={saving}><X size={18} /></button><p className="admin-kicker"><span /> News desk</p><h2 id="create-news-title">Add News Article</h2>
      {error && <div className="admin-payment-error" role="alert">{error}</div>}
      <form className="admin-content-form" onSubmit={submit}>
        <label>Headline<input required maxLength={180} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
        <label>Excerpt<textarea required maxLength={500} rows="2" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></label>
        <label>Article content<textarea required maxLength={30000} rows="7" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></label>
        <label>Category<input required maxLength={80} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Events, Insights, Milestone…" /></label>
        <label>Author or byline<input required maxLength={150} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></label>
        <label>Image URL <span>(optional; HTTP or HTTPS)</span><input type="url" maxLength={2048} value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></label>
        <label>Visibility<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select></label>
        <div className="admin-sample-modal-actions"><button type="button" onClick={() => setOpen(false)} disabled={saving}>Cancel</button><button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Article'}</button></div>
      </form>
    </div></div>}
  </div></AdminLayout>
}
