export const ADMIN_ROLES = [
  'SUPER_ADMIN',
  'MEMBERSHIP_ADMIN',
  'FINANCE_ADMIN',
  'EVENTS_ADMIN',
  'COMMUNICATIONS_ADMIN',
]

export const ADMIN_GATE_PERMISSIONS = [
  'applications.view',
  'members.view',
  'membership.read',
  'payments.view',
  'invoices.read',
  'events.view',
  'communications.view',
  'news.view',
  'reports.view',
  'users.view',
  'audit_logs.view',
]

export const ADMIN_MODULE_PERMISSIONS = {
  Applications: ['applications.view', 'applications.read', 'applications.manage'],
  Members: ['members.view', 'members.read', 'members.manage'],
  Payments: ['payments.view', 'payments.read', 'payments.manage'],
  Events: ['events.view', 'events.read', 'events.manage'],
  News: ['news.view', 'news.read', 'news.manage'],
  Reports: ['reports.view', 'reports.read'],
  'Users & Roles': ['users.view', 'users.read', 'users.manage'],
  'Audit Logs': ['audit_logs.view', 'audit_logs.read'],
}

export const isAdministrativeRole = (roleName) => ADMIN_ROLES.includes(roleName)

export const hasAdministrativePermission = (user) => {
  const roleName = user?.role?.name || user?.role
  if (roleName === 'SUPER_ADMIN') return true

  const permissions = Array.isArray(user?.permissions) ? user.permissions : []
  return permissions.some((permission) =>
    Object.values(ADMIN_MODULE_PERMISSIONS).some((modulePermissions) => modulePermissions.includes(permission)),
  )
}

export const hasModulePermission = (user, moduleName) => {
  const roleName = user?.role?.name || user?.role
  if (roleName === 'SUPER_ADMIN') return true

  const permissions = Array.isArray(user?.permissions) ? user.permissions : []
  return (ADMIN_MODULE_PERMISSIONS[moduleName] || []).some((permission) => permissions.includes(permission))
}
