import { useCallback, useEffect, useState } from 'react'
import { Newspaper, Plus, X, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/context/AuthContext'
import {
  createAdminNewsApi, deleteAdminNewsApi, getAdminNewsApi, resolveNewsImageUrl, uploadAdminNewsImageApi,
  setAdminNewsPublicationApi, updateAdminNewsApi,
} from '@/services/adminContentService'

const can = (user, permissions) => (user?.role?.name || user?.role) === 'SUPER_ADMIN' || permissions.some((item) => user?.permissions?.includes(item))
const dateValue = (value) => value ? new Date(value).toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const initialForm = { title: '', excerpt: '', content: '', category: '', author: '', image_url: '', status: 'DRAFT' }
const fields = ['title', 'excerpt', 'content', 'category', 'author', 'image_url']
const messageFrom = (err, fallback) => {
  const errors = err.response?.data?.errors
  const details = errors && Object.values(errors).join(' ')
  return details || err.response?.data?.message || (!err.response ? 'The News API could not be reached.' : fallback)
}

export default function Communications() {
  const { user } = useAuth()
  const canCreate = can(user, ['news.create', 'news.manage'])
  const canUpdate = can(user, ['news.update', 'news.manage'])
  const canPublish = can(user, ['news.publish', 'news.manage'])
  const canDelete = can(user, ['news.delete', 'news.manage'])
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState('')
  const [pendingId, setPendingId] = useState(null)
  const [form, setForm] = useState(initialForm)

  const loadNews = useCallback(async () => {
    setLoading(true); setError('')
    try { const result = await getAdminNewsApi(); setArticles(Array.isArray(result?.data) ? result.data : []) }
    catch (err) { setError(messageFrom(err, 'News could not be loaded.')) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    let active = true
    getAdminNewsApi().then((result) => {
      if (active) setArticles(Array.isArray(result?.data) ? result.data : [])
    }).catch((err) => {
      if (active) setError(messageFrom(err, 'News could not be loaded.'))
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const root = document.documentElement
    const adminContent = document.querySelector('.admin-main-content')
    const previousOverflow = document.body.style.overflow
    const previousRootOverflow = root.style.overflow
    const previousAdminContentOverflow = adminContent?.style.overflowY
    document.body.style.overflow = 'hidden'
    root.style.overflow = 'hidden'
    if (adminContent) adminContent.style.overflowY = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      root.style.overflow = previousRootOverflow
      if (adminContent) adminContent.style.overflowY = previousAdminContentOverflow
    }
  }, [open])

  const openCreate = () => { setEditing(null); setForm(initialForm); setImagePreview(''); setError(''); setOpen(true) }
  const openEdit = (article) => {
    setEditing(article)
    setForm(Object.fromEntries(fields.map((field) => [field, article[field] || ''])))
    setImagePreview(resolveNewsImageUrl(article.image_url))
    setError(''); setOpen(true)
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
      const result = await uploadAdminNewsImageApi(file)
      const imageUrl = result?.data?.image_url
      if (!imageUrl) throw new Error('The image upload did not return an image URL.')
      setForm((current) => ({ ...current, image_url: imageUrl }))
      // Keep the local preview visible immediately; the saved article uses the
      // persistent API URL stored in image_url.
      setImagePreview(previewUrl)
    } catch (err) {
      setError(messageFrom(err, 'The image could not be uploaded.'))
      setForm((current) => ({ ...current, image_url: '' }))
      setImagePreview('')
      input.value = ''
    } finally {
      setImageUploading(false)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    setSaving(true); setError(''); setNotice('')
    const data = { ...form, image_url: form.image_url || null }
    try {
      const result = editing
        ? await updateAdminNewsApi(editing.id, Object.fromEntries(Object.entries(data).filter(([key]) => key !== 'status')))
        : await createAdminNewsApi(data)
      setNotice(result?.message || (editing ? 'News article updated.' : 'News article created.'))
      setOpen(false); setEditing(null); setForm(initialForm)
      await loadNews()
    } catch (err) { setError(messageFrom(err, editing ? 'News article could not be updated.' : 'News article could not be created.')) }
    finally { setSaving(false) }
  }

  const changePublication = async (article) => {
    const status = article.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    setPendingId(article.id); setError(''); setNotice('')
    try {
      const result = await setAdminNewsPublicationApi(article.id, status)
      setNotice(result?.message || (status === 'PUBLISHED' ? 'News article published.' : 'News article unpublished.'))
      await loadNews()
    } catch (err) { setError(messageFrom(err, 'The article publication status could not be changed.')) }
    finally { setPendingId(null) }
  }

  const removeArticle = async (article) => {
    if (!window.confirm(`Delete “${article.title}”? This cannot be undone.`)) return
    setPendingId(article.id); setError(''); setNotice('')
    try {
      const result = await deleteAdminNewsApi(article.id)
      setNotice(result?.message || 'News article deleted.')
      await loadNews()
    } catch (err) { setError(messageFrom(err, 'News article could not be deleted.')) }
    finally { setPendingId(null) }
  }

  const hasActions = canUpdate || canPublish || canDelete
  return <AdminLayout><div className="admin-sample-module admin-content-module">
    <div className="admin-sample-title"><div><p className="admin-kicker"><span /> Admin workspace</p><h1>News</h1><p>Create and manage WISTA Singapore news and stories.</p></div>{canCreate && <button type="button" className="admin-sample-primary" onClick={openCreate}><Plus size={15} /> Add News</button>}</div>
    {notice && <div className="admin-sample-notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss message"><X size={16} /></button></div>}
    {error && !open && <div className="admin-payment-error" role="alert">{error}<button type="button" onClick={loadNews}>Try again</button></div>}
    <div className="admin-sample-controls"><span>{articles.length} saved article{articles.length === 1 ? '' : 's'}</span></div>
    <div className="admin-sample-table-wrap"><table className="admin-sample-table"><thead><tr><th>Article</th><th>Category</th><th>Author</th><th>Status</th><th>Published</th>{hasActions && <th>Actions</th>}</tr></thead><tbody>
      {loading ? <tr><td colSpan={hasActions ? 6 : 5} className="admin-sample-empty" role="status">Loading news…</td></tr> : articles.length ? articles.map((item) => <tr key={item.id}><td data-label="Article"><strong>{item.title}</strong><p className="admin-content-excerpt">{item.excerpt}</p></td><td data-label="Category">{item.category}</td><td data-label="Author">{item.author}</td><td data-label="Status"><span className={`admin-sample-status status-${item.status.toLowerCase()}`}>{item.status}</span></td><td data-label="Published">{dateValue(item.published_at)}</td>{hasActions && <td data-label="Actions"><div className="admin-sample-actions">
        {canUpdate && <button type="button" className="admin-sample-button" onClick={() => openEdit(item)} aria-label={`Edit ${item.title}`}><Pencil size={14} /> Edit</button>}
        {canPublish && <button type="button" className="admin-sample-button" onClick={() => changePublication(item)} disabled={pendingId === item.id} aria-label={`${item.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'} ${item.title}`}>{item.status === 'PUBLISHED' ? <EyeOff size={14} /> : <Eye size={14} />}{pendingId === item.id ? 'Saving…' : item.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}</button>}
        {canDelete && <button type="button" className="admin-sample-button" onClick={() => removeArticle(item)} disabled={pendingId === item.id} aria-label={`Delete ${item.title}`}><Trash2 size={14} /> Delete</button>}
      </div></td>}</tr>) : <tr><td colSpan={hasActions ? 6 : 5} className="admin-sample-empty"><Newspaper size={23} /><h2>No news articles have been added</h2><p>Create an article to start the news archive.</p></td></tr>}
    </tbody></table></div>
    {!canCreate && <p className="admin-content-help">Your role can view news but cannot create articles.</p>}
    {open && <div className="admin-sample-modal admin-news-modal" role="dialog" aria-modal="true" aria-labelledby="news-form-title"><div><button type="button" className="admin-sample-modal-close" onClick={() => !saving && setOpen(false)} aria-label="Close form" disabled={saving}><X size={18} /></button><p className="admin-kicker"><span /> News desk</p><h2 id="news-form-title">{editing ? 'Edit News Article' : 'Add News Article'}</h2>
      {error && <div className="admin-payment-error" role="alert">{error}</div>}
      <form className="admin-content-form" onSubmit={submit}>
        <label>Headline<input required maxLength={180} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
        <label>Excerpt<textarea required maxLength={500} rows="2" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></label>
        <label>Article content<textarea required maxLength={30000} rows="7" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></label>
        <label>Category<input required maxLength={80} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Events, Insights, Milestone…" /></label>
        <label>Author or byline<input required maxLength={150} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></label>
        <label>Image file <span>(optional; JPEG, PNG, or WebP, up to 5 MB)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} disabled={imageUploading || saving} /></label>
        {imagePreview && <div className="admin-news-image-preview"><span>Image preview</span><img src={imagePreview} alt="News article preview" />{imageUploading && <small role="status">Uploading image…</small>}</div>}
        {!editing && canPublish && <label>Visibility<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select></label>}
        {!editing && !canPublish && <p className="admin-content-help">New articles are saved as drafts. A user with publish permission can publish them.</p>}
        <div className="admin-sample-modal-actions"><button type="button" onClick={() => setOpen(false)} disabled={saving || imageUploading}>Cancel</button><button type="submit" disabled={saving || imageUploading}>{saving ? 'Saving…' : imageUploading ? 'Uploading image…' : editing ? 'Save Changes' : 'Save Article'}</button></div>
      </form>
    </div></div>}
  </div></AdminLayout>
}
