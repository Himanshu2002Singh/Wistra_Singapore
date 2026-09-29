export const dashboardData = {
  stats: {
    totalMembers: 250,
    activeMembers: 235,
    pendingApplications: 15,
    expiringMemberships: 8,
    revenue: 45000,
    outstandingPayments: 2500
  },
  recentActivity: [
    { id: 1, action: 'New member application', user: 'Jane Tan', time: '2 hours ago' },
    { id: 2, action: 'Event registration', user: 'Alice Lim', event: 'AGM 2026', time: '5 hours ago' }
  ],
  notifications: [
    { id: 1, message: 'Membership renewal due in 30 days', type: 'warning' },
    { id: 2, message: 'New event posted: Tech in Maritime', type: 'info' }
  ],
  upcomingEvents: [
    { id: 1, title: 'WISTA SG AGM 2026', date: '2026-10-15' },
    { id: 2, title: 'Maritime Networking Night', date: '2026-11-20' }
  ]
}

export const dashboardStats = dashboardData.stats
export const recentActivity = dashboardData.recentActivity
export const notifications = dashboardData.notifications
export const upcomingEvents = dashboardData.upcomingEvents
