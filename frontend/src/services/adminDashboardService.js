import api from './api'
import { getAdminEventsApi } from './adminContentService'
import { getAdminAuditLogsApi } from './adminAuditLogService'

export const getAdminDashboardSummaryApi = async ({ members, applications, events, audit } = {}) => {
  const requests = await Promise.allSettled([
    members ? api.get('/admin/memberships', { params: { status: 'ACTIVE', limit: 1 } }) : null,
    applications ? api.get('/admin/applications', { params: { status: 'PENDING', limit: 1 } }) : null,
    events ? getAdminEventsApi() : null,
    audit ? getAdminAuditLogsApi({ limit: 5 }) : null,
  ])
  const [membershipResult, applicationResult, eventsResult, auditResult] = requests
  return {
    asOf: Date.now(),
    memberships: membershipResult.status === 'fulfilled' && membershipResult.value ? membershipResult.value.data?.data?.total ?? null : null,
    applications: applicationResult.status === 'fulfilled' && applicationResult.value ? applicationResult.value.data?.data?.total ?? null : null,
    events: eventsResult.status === 'fulfilled' && eventsResult.value ? eventsResult.value.data || [] : null,
    audit: auditResult.status === 'fulfilled' && auditResult.value ? auditResult.value.data?.data?.logs || [] : null,
    errors: {
      memberships: membershipResult.status === 'rejected',
      applications: applicationResult.status === 'rejected',
      events: eventsResult.status === 'rejected',
      audit: auditResult.status === 'rejected',
    },
  }
}
