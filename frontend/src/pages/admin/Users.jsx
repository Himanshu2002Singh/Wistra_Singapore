import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, Plus, Search, X } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/context/AuthContext'
import {
  assignExistingAdminUserRoleApi,
  createAdminTeamMemberApi,
  getAdminPermissionsApi,
  getAdminRolesApi,
  getAdminUserByIdApi,
  getAdminUsersApi,
} from '@/services/adminUserAccessService'

const PAGE_SIZE = 10
const humanize = (value) => String(value ?? '').replaceAll('_', ' ')
const dateValue = (value, includeTime = false) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-SG', includeTime
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' })
}
const userName = (user) => [user?.first_name, user?.last_name].filter(Boolean).join(' ') || '—'
const isAdminRole = (role) => role?.name === 'SUPER_ADMIN' || (typeof role?.name === 'string' && role.name.endsWith('_ADMIN'))
const errorMessage = (error, subject) => {
  const status = error.response?.status
  if (status === 401) return 'Your session has expired. Sign in again to continue.'
  if (status === 403) return 'You do not have permission to view team and role records.'
  if (status === 404) return `${subject} was not found.`
  if (status === 400) return error.response?.data?.message || 'The filter values are invalid.'
  if (!error.response) return 'The Admin Users API could not be reached. Check the connection and try again.'
  return error.response?.data?.message || 'The request failed. Try again.'
}

function DetailRows({ title, values }) {
  const entries = Object.entries(values).filter(([, value]) => value !== null && value !== undefined && value !== '')
  if (!entries.length) return null
  return <section className="admin-user-detail-section"><h3>{title}</h3><dl>{entries.map(([key, value]) => <React.Fragment key={key}><dt>{humanize(key)}</dt><dd>{String(value)}</dd></React.Fragment>)}</dl></section>
}

export default function Users() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [roleId, setRoleId] = useState('')
  const [status, setStatus] = useState('')
  const [statuses, setStatuses] = useState([])
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [directoryLoading, setDirectoryLoading] = useState(true)
  const [usersError, setUsersError] = useState('')
  const [directoryError, setDirectoryError] = useState('')
  const [activeView, setActiveView] = useState('users')
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [memberMode, setMemberMode] = useState('create')
  const [memberEmail, setMemberEmail] = useState('')
  const [memberFirstName, setMemberFirstName] = useState('')
  const [memberLastName, setMemberLastName] = useState('')
  const [memberPhone, setMemberPhone] = useState('')
  const [memberPassword, setMemberPassword] = useState('')
  const [memberPasswordConfirm, setMemberPasswordConfirm] = useState('')
  const [memberRoleId, setMemberRoleId] = useState('')
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const [assignmentError, setAssignmentError] = useState('')
  const [notice, setNotice] = useState('')
  const listSequence = useRef(0)
  const detailSequence = useRef(0)

  const loadUsers = useCallback(async () => {
    const sequence = ++listSequence.current
    setUsersLoading(true)
    setUsersError('')
    try {
      const response = await getAdminUsersApi({
        page,
        limit: PAGE_SIZE,
        team_only: true,
        ...(query.trim() ? { search: query.trim() } : {}),
        ...(roleId ? { role_id: roleId } : {}),
        ...(status ? { status } : {}),
      })
      if (sequence !== listSequence.current) return
      const data = response?.data || {}
      const nextUsers = Array.isArray(data.users) ? data.users : []
      setUsers(nextUsers)
      setTotal(Number(data.total) || 0)
      setTotalPages(Math.max(Number(data.totalPages) || 1, 1))
      setStatuses(Array.isArray(data.statuses) ? data.statuses : [])
    } catch (error) {
      if (sequence === listSequence.current) {
        setUsers([])
        setTotal(0)
        setTotalPages(1)
        setUsersError(errorMessage(error, 'Users'))
      }
    } finally {
      if (sequence === listSequence.current) setUsersLoading(false)
    }
  }, [page, query, roleId, status])

  const loadDirectory = useCallback(async () => {
    try {
      const [roleResponse, permissionResponse] = await Promise.all([
        getAdminRolesApi(),
        getAdminPermissionsApi(),
      ])
      setRoles(Array.isArray(roleResponse?.data) ? roleResponse.data : [])
      setPermissions(Array.isArray(permissionResponse?.data) ? permissionResponse.data : [])
    } catch (error) {
      setRoles([])
      setPermissions([])
      setDirectoryError(errorMessage(error, 'Roles and permissions'))
    } finally {
      setDirectoryLoading(false)
    }
  }, [])

  const retryDirectory = () => {
    setDirectoryLoading(true)
    setDirectoryError('')
    loadDirectory()
  }

  useEffect(() => {
    const timer = window.setTimeout(loadUsers, query ? 300 : 0)
    return () => window.clearTimeout(timer)
  }, [loadUsers, query])

  // Start the initial API read; its state updates happen after the requests settle.
  // eslint-disable-next-line react/set-state-in-effect
  useEffect(() => { loadDirectory() }, [loadDirectory])

  const loadDetail = useCallback(async (id) => {
    const sequence = ++detailSequence.current
    setSelectedId(id)
    setDetail(null)
    setDetailError('')
    setDetailLoading(true)
    try {
      const response = await getAdminUserByIdApi(id)
      if (sequence === detailSequence.current) setDetail(response?.data || null)
    } catch (error) {
      if (sequence === detailSequence.current) setDetailError(errorMessage(error, 'User'))
    } finally {
      if (sequence === detailSequence.current) setDetailLoading(false)
    }
  }, [])

  const closeDetail = () => {
    detailSequence.current += 1
    setSelectedId(null)
    setDetail(null)
    setDetailError('')
  }

  const closeAddMember = () => {
    if (assignmentLoading) return
    setAddMemberOpen(false)
    setMemberMode('create')
    setMemberEmail('')
    setMemberFirstName('')
    setMemberLastName('')
    setMemberPhone('')
    setMemberPassword('')
    setMemberPasswordConfirm('')
    setMemberRoleId('')
    setAssignmentError('')
  }

  const selectMemberMode = (mode) => {
    if (assignmentLoading) return
    setMemberMode(mode)
    setAssignmentError('')
    setMemberFirstName('')
    setMemberLastName('')
    setMemberPhone('')
    setMemberPassword('')
    setMemberPasswordConfirm('')
  }

  const submitTeamMember = async (event) => {
    event.preventDefault()
    if (assignmentLoading) return
    const selectedRole = roles.find((role) => String(role.id) === memberRoleId && isAdminRole(role))
    if (!memberEmail.trim() || !selectedRole) {
      setAssignmentError(!memberEmail.trim() ? 'Email address is required.' : 'Select an existing administrative role.')
      return
    }
    if (memberMode === 'create' && memberPassword !== memberPasswordConfirm) {
      setAssignmentError('The passwords do not match.')
      return
    }

    setAssignmentLoading(true)
    setAssignmentError('')
    setNotice('')
    try {
      const response = memberMode === 'create'
        ? await createAdminTeamMemberApi({
          email: memberEmail.trim(),
          first_name: memberFirstName.trim(),
          last_name: memberLastName.trim(),
          phone: memberPhone.trim() || undefined,
          password: memberPassword,
          role_id: selectedRole.id,
        })
        : await assignExistingAdminUserRoleApi({ email: memberEmail.trim(), role_id: selectedRole.id })
      setAddMemberOpen(false)
      setMemberMode('create')
      setMemberEmail('')
      setMemberFirstName('')
      setMemberLastName('')
      setMemberPhone('')
      setMemberPassword('')
      setMemberPasswordConfirm('')
      setMemberRoleId('')
      setNotice(response?.message || (memberMode === 'create' ? 'Team member account created.' : 'Existing account added to the admin team.'))
      await loadUsers()
    } catch (error) {
      const statusCode = error.response?.status
      const responseCode = error.response?.data?.code
      if (memberMode === 'create' && statusCode === 409 && responseCode === 'EMAIL_ALREADY_REGISTERED') {
        setMemberMode('existing')
        setMemberFirstName('')
        setMemberLastName('')
        setMemberPhone('')
        setMemberPassword('')
        setMemberPasswordConfirm('')
        setAssignmentError('This email already belongs to an account. The account password was not changed. Review the selected role and submit again to add the existing account.')
        return
      }
      const fieldErrors = Object.values(error.response?.data?.errors || {}).join(' ')
      const message = statusCode === 403
        ? 'Only a Super Admin can assign an administrative role.'
        : statusCode === 404
          ? error.response?.data?.message || 'No registered account exists for that email. The person must register first.'
          : statusCode === 409 || statusCode === 400
            ? fieldErrors || error.response?.data?.message || 'Check the email and selected role, then try again.'
            : errorMessage(error, 'Team member')
      setAssignmentError(message)
    } finally {
      setAssignmentLoading(false)
    }
  }

  const adminRoles = roles.filter(isAdminRole)
  const isSuperAdmin = (user?.role?.name || user?.role) === 'SUPER_ADMIN'

  return <AdminLayout><div className="admin-sample-module admin-users-module">
    <div className="admin-sample-title"><div><p className="admin-kicker"><span /> Admin workspace</p><h1>Team and Roles</h1><p>View the admin team, assigned roles, and database permission mappings.</p></div>{isSuperAdmin && <button type="button" className="admin-sample-primary" onClick={() => { setMemberMode('create'); setAssignmentError(''); setAddMemberOpen(true) }}><Plus size={15} /> Add Team Member</button>}</div>
    {notice && <div className="admin-sample-notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss message"><X size={16} /></button></div>}
    {!isSuperAdmin && <div className="admin-sample-notice" role="note"><span>Administrative team accounts and role assignments are restricted to Super Admin.</span></div>}
    <div className="admin-users-tabs" role="tablist" aria-label="Team administration views">
      <button type="button" role="tab" aria-selected={activeView === 'users'} className={activeView === 'users' ? 'is-active' : ''} onClick={() => setActiveView('users')}>Team members</button>
      <button type="button" role="tab" aria-selected={activeView === 'roles'} className={activeView === 'roles' ? 'is-active' : ''} onClick={() => setActiveView('roles')}>Roles &amp; permissions</button>
    </div>

    {activeView === 'users' ? <>
      <div className="admin-sample-controls">
        <label><Search size={16} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search name or email..." aria-label="Search users by name or email" /></label>
        <select value={roleId} onChange={(event) => { setRoleId(event.target.value); setPage(1) }} aria-label="Filter by assigned role"><option value="">All roles</option>{adminRoles.map((role) => <option key={role.id} value={role.id}>{humanize(role.name)}</option>)}</select>
        <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} aria-label="Filter by account status"><option value="">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}</select>
      </div>
      {usersError && <div className="admin-payment-error" role="alert">{usersError}<button type="button" onClick={loadUsers}>Try again</button></div>}
      <div className="admin-sample-table-wrap"><table className="admin-sample-table"><thead><tr><th>User ID</th><th>Name</th><th>Email</th><th>Role</th><th>Account status</th><th>Created</th><th aria-label="Actions">Actions</th></tr></thead><tbody>
        {usersLoading ? <tr><td colSpan="7" className="admin-sample-empty" role="status">Loading users…</td></tr> : users.length ? users.map((item) => <tr key={item.id}>
          <td data-label="User ID">{item.id}</td><td data-label="Name">{userName(item)}</td><td data-label="Email">{item.email}</td><td data-label="Role">{humanize(item.role?.name) || '—'}</td>
          <td data-label="Account status"><span className={`admin-sample-status status-${String(item.status || '').toLowerCase()}`}>{humanize(item.status)}</span></td><td data-label="Created">{dateValue(item.created_at)}</td>
          <td data-label="Actions"><div className="admin-sample-actions"><button type="button" onClick={() => loadDetail(item.id)} className="admin-sample-view"><Eye size={14} /> View</button></div></td>
        </tr>) : <tr><td colSpan="7" className="admin-sample-empty">{total ? 'No users match these filters.' : 'No users found.'}</td></tr>}
      </tbody></table></div>
      <div className="admin-sample-pagination"><span>{usersLoading ? 'Loading records' : `${total} team member${total === 1 ? '' : 's'}${totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ''}`}</span><div><button type="button" disabled={usersLoading || page <= 1} onClick={() => setPage((current) => Math.max(current - 1, 1))}>Previous</button><button type="button" disabled={usersLoading || page >= totalPages} onClick={() => setPage((current) => Math.min(current + 1, totalPages))}>Next</button></div></div>
    </> : <>
      {directoryError && <div className="admin-payment-error" role="alert">{directoryError}<button type="button" onClick={retryDirectory}>Try again</button></div>}
      {directoryLoading ? <div className="admin-sample-empty" role="status">Loading roles and permissions…</div> : <>
        <section className="admin-user-roles-section"><div className="admin-user-section-heading"><h2>Roles</h2><span>{roles.length} database role{roles.length === 1 ? '' : 's'}</span></div>
          {roles.length ? <div className="admin-user-role-grid">{roles.map((role) => <article className="admin-user-role-card" key={role.id}><h3>{humanize(role.name)}</h3><p>{role.description || 'No description stored.'}</p><span>{Array.isArray(role.permissions) ? role.permissions.length : 0} assigned permissions</span></article>)}</div> : <div className="admin-sample-empty">No roles found.</div>}
        </section>
        <section className="admin-user-roles-section"><div className="admin-user-section-heading"><h2>Permissions</h2><span>{permissions.length} database permission{permissions.length === 1 ? '' : 's'}</span></div>
          <div className="admin-sample-table-wrap"><table className="admin-sample-table"><thead><tr><th>Permission</th><th>Description</th><th>Assigned roles</th></tr></thead><tbody>
            {permissions.length ? permissions.map((permission) => <tr key={permission.id}><td data-label="Permission">{permission.name}</td><td data-label="Description">{permission.description || '—'}</td><td data-label="Assigned roles">{Array.isArray(permission.roles) && permission.roles.length ? permission.roles.map((role) => humanize(role.name)).join(', ') : '—'}</td></tr>) : <tr><td colSpan="3" className="admin-sample-empty">No permissions found.</td></tr>}
          </tbody></table></div>
        </section>
      </>}
    </>}

    {selectedId !== null && <div className="admin-sample-modal" role="dialog" aria-modal="true" aria-label="User details"><div>
      <button className="admin-sample-modal-close" onClick={closeDetail} aria-label="Close user details"><X size={18} /></button>
      <p className="admin-kicker"><span /> Team member detail</p>
      {detailLoading ? <p className="admin-user-detail-state" role="status">Loading user details…</p> : detailError ? <div className="admin-payment-error" role="alert">{detailError}<button type="button" onClick={() => loadDetail(selectedId)}>Try again</button></div> : detail && <>
        <h2>{userName(detail)}</h2>
        <DetailRows title="Account" values={{ user_id: detail.id, email: detail.email, status: detail.status, role: detail.role?.name ? humanize(detail.role.name) : '—', created_at: dateValue(detail.created_at, true), updated_at: dateValue(detail.updated_at, true) }} />
        <p className="admin-user-detail-state">Credentials, password hashes, and tokens are not returned by the admin API.</p>
      </>}
      <div className="admin-sample-modal-actions"><button type="button" onClick={closeDetail}>Close</button></div>
    </div></div>}

    {addMemberOpen && <div className="admin-sample-modal" role="dialog" aria-modal="true" aria-labelledby="add-team-member-title"><div>
      <button type="button" className="admin-sample-modal-close" onClick={closeAddMember} aria-label="Close add team member form" disabled={assignmentLoading}><X size={18} /></button>
      <p className="admin-kicker"><span /> Team access</p>
      <h2 id="add-team-member-title">Add Team Member</h2>
      <div className="admin-team-mode-switch" role="group" aria-label="Choose team member account flow">
        <button type="button" aria-pressed={memberMode === 'create'} className={memberMode === 'create' ? 'is-active' : ''} onClick={() => selectMemberMode('create')} disabled={assignmentLoading}>Create new account</button>
        <button type="button" aria-pressed={memberMode === 'existing'} className={memberMode === 'existing' ? 'is-active' : ''} onClick={() => selectMemberMode('existing')} disabled={assignmentLoading}>Use existing account</button>
      </div>
      <p className="admin-team-form-help">{memberMode === 'create' ? 'Create a new account and assign an existing administrative role. No invitation email is sent.' : 'Assign an already registered account. Its password and personal details will not be changed.'}</p>
      {assignmentError && <div className="admin-payment-error" role="alert">{assignmentError}</div>}
      {directoryError && <div className="admin-payment-error" role="alert">{directoryError}<button type="button" onClick={retryDirectory}>Reload roles</button></div>}
      <form className="admin-team-form" onSubmit={submitTeamMember}>
        {memberMode === 'create' && <>
          <label htmlFor="team-member-first-name">First name<input id="team-member-first-name" type="text" required maxLength={100} autoComplete="given-name" value={memberFirstName} onChange={(event) => setMemberFirstName(event.target.value)} /></label>
          <label htmlFor="team-member-last-name">Last name<input id="team-member-last-name" type="text" required maxLength={100} autoComplete="family-name" value={memberLastName} onChange={(event) => setMemberLastName(event.target.value)} /></label>
        </>}
        <label htmlFor="team-member-email">Email address<input id="team-member-email" type="email" required maxLength={255} autoComplete="email" value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} placeholder="name@example.com" /></label>
        {memberMode === 'create' && <>
          <label htmlFor="team-member-phone">Phone number <span>(optional)</span><input id="team-member-phone" type="tel" maxLength={20} autoComplete="tel" value={memberPhone} onChange={(event) => setMemberPhone(event.target.value)} /></label>
          <label htmlFor="team-member-password">Create password<input id="team-member-password" type="password" required minLength={8} autoComplete="new-password" value={memberPassword} onChange={(event) => setMemberPassword(event.target.value)} /></label>
          <label htmlFor="team-member-password-confirm">Confirm password<input id="team-member-password-confirm" type="password" required minLength={8} autoComplete="new-password" value={memberPasswordConfirm} onChange={(event) => setMemberPasswordConfirm(event.target.value)} /></label>
        </>}
        <label htmlFor="team-member-role">Administrative role<select id="team-member-role" required value={memberRoleId} onChange={(event) => setMemberRoleId(event.target.value)} disabled={directoryLoading || adminRoles.length === 0}><option value="">{directoryLoading ? 'Loading existing roles…' : adminRoles.length ? 'Select an existing role' : 'No administrative roles available'}</option>{adminRoles.map((role) => <option key={role.id} value={role.id}>{humanize(role.name)}</option>)}</select></label>
        {memberMode === 'create' && <p className="admin-team-form-help">Use at least 8 characters. Give the new team member their password through a secure channel; no invitation email is sent.</p>}
        <div className="admin-sample-modal-actions"><button type="button" onClick={closeAddMember} disabled={assignmentLoading}>Cancel</button><button type="submit" disabled={assignmentLoading || directoryLoading || !memberRoleId}>{assignmentLoading ? (memberMode === 'create' ? 'Creating account…' : 'Assigning role…') : (memberMode === 'create' ? 'Create Team Account' : 'Add to Team')}</button></div>
      </form>
    </div></div>}
  </div></AdminLayout>
}
