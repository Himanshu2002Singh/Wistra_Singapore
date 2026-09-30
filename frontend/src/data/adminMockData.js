export const adminApplications = [
  { id: 'APP-2026-001', name: 'Sarah Tan', email: 'sarah.tan@oceanic.example', type: 'Individual', company: 'Oceanic Maritime Pte Ltd', designation: 'Operations Manager', submitted: '24 Sep 2026', status: 'Pending Review', notes: 'Individual membership application awaiting EXCO review.' },
  { id: 'APP-2026-002', name: 'Michael Lim', email: 'michael.lim@pacific.example', type: 'Individual', company: 'Pacific Shipping Group', designation: 'Commercial Director', submitted: '22 Sep 2026', status: 'Under Review', notes: 'Supporting information is complete.' },
  { id: 'APP-2026-003', name: 'Maritime Nexus Pte Ltd', email: 'membership@maritimenexus.example', type: 'Corporate', company: 'Maritime Nexus Pte Ltd', designation: 'Corporate representative', submitted: '21 Sep 2026', status: 'Pending Review', notes: 'Corporate membership application.' },
  { id: 'APP-2026-004', name: 'Michelle Wong', email: 'michelle.wong@harbour.example', type: 'Individual', company: 'Harbour Logistics Singapore', designation: 'Business Development Lead', submitted: '19 Sep 2026', status: 'Clarification Required', notes: 'Awaiting clarification from applicant.' },
]

export const adminMembers = [
  { id: 'MEM-001', name: 'Sarah Tan', email: 'sarah.tan@oceanic.example', type: 'Individual', company: 'Oceanic Maritime Pte Ltd', designation: 'Operations Manager', status: 'Active', joinedDate: '01 Jun 2026', membershipNumber: 'WISTA-SG-000101' },
  { id: 'MEM-002', name: 'Michelle Wong', email: 'michelle.wong@harbour.example', type: 'Individual', company: 'Harbour Logistics Singapore', designation: 'Business Development Lead', status: 'Active', joinedDate: '01 Jun 2026', membershipNumber: 'WISTA-SG-000102' },
  { id: 'MEM-003', name: 'Michael Lim', email: 'michael.lim@pacific.example', type: 'Individual', company: 'Pacific Shipping Group', designation: 'Commercial Director', status: 'Active', joinedDate: '01 Jun 2026', membershipNumber: 'WISTA-SG-000103' },
  { id: 'MEM-004', name: 'Maritime Nexus Pte Ltd', email: 'membership@maritimenexus.example', type: 'Corporate', company: 'Maritime Nexus Pte Ltd', designation: 'Corporate account', status: 'Suspended', joinedDate: '01 Jun 2026', membershipNumber: 'WISTA-SG-000104' },
]

export const adminPayments = [
  { id: 'PAY-2026-001', name: 'Sarah Tan', category: 'Membership', amount: 'SGD 500 (sample)', method: 'Bank Transfer', status: 'Pending Verification', date: '24 Sep 2026', invoice: 'INV-2026-001' },
  { id: 'PAY-2026-002', name: 'Maritime Nexus Pte Ltd', category: 'Corporate Membership', amount: 'SGD 1,200 (sample)', method: 'PayNow', status: 'Paid', date: '23 Sep 2026', invoice: 'INV-2026-002' },
  { id: 'PAY-2026-003', name: 'Michelle Wong', category: 'Membership Renewal', amount: 'SGD 500 (sample)', method: 'Bank Transfer', status: 'Paid', date: '18 Sep 2026', invoice: 'INV-2026-003' },
]

export const adminEvents = [
  { id: 'EVT-2026-001', title: 'WISTA Singapore Networking Evening', date: '24 Sep 2026', location: 'Marina Bay, Singapore', capacity: 150, registered: 128, status: 'Upcoming' },
  { id: 'EVT-2026-002', title: 'Women in Maritime Leadership Forum', date: '15 Oct 2026', location: 'Singapore', capacity: 120, registered: 96, status: 'Upcoming' },
  { id: 'EVT-2026-003', title: 'Maritime Sustainability Roundtable', date: '02 Nov 2026', location: 'Singapore', capacity: 80, registered: 64, status: 'Draft' },
]

export const adminCommunications = [
  { id: 'COM-001', title: 'Membership Renewal Reminder', audience: 'Active Members', type: 'Email', status: 'Scheduled', updated: '24 Sep 2026', summary: 'Sample reminder campaign for the next membership cycle.' },
  { id: 'COM-002', title: 'WISTA Singapore Newsletter', audience: 'All Members', type: 'Newsletter', status: 'Sent', updated: '20 Sep 2026', summary: 'Sample newsletter covering community updates and upcoming events.' },
  { id: 'COM-003', title: 'Upcoming Networking Event', audience: 'Singapore Members', type: 'Announcement', status: 'Draft', updated: '18 Sep 2026', summary: 'Sample event announcement awaiting editorial review.' },
]

export const adminReports = [
  { id: 'REP-001', title: 'Membership Overview', type: 'Membership', generated: '24 Sep 2026', description: 'Sample overview of membership status and growth.' },
  { id: 'REP-002', title: 'Financial Summary', type: 'Finance', generated: '23 Sep 2026', description: 'Sample payment and invoice activity summary.' },
  { id: 'REP-003', title: 'Event Registration Report', type: 'Events', generated: '21 Sep 2026', description: 'Sample attendance and registrations snapshot.' },
  { id: 'REP-004', title: 'Application Report', type: 'Applications', generated: '20 Sep 2026', description: 'Sample application review queue summary.' },
]

export const adminUsers = [
  { id: 'USR-001', name: 'Admin User', email: 'admin@wista.example', role: 'SUPER_ADMIN', status: 'Active', lastActive: 'Today, 09:41' },
  { id: 'USR-002', name: 'Membership Manager', email: 'membership@wista.example', role: 'MEMBERSHIP_ADMIN', status: 'Active', lastActive: 'Today, 08:15' },
  { id: 'USR-003', name: 'Finance Manager', email: 'finance@wista.example', role: 'FINANCE_ADMIN', status: 'Active', lastActive: 'Yesterday, 16:30' },
  { id: 'USR-004', name: 'Events Manager', email: 'events@wista.example', role: 'EVENTS_ADMIN', status: 'Active', lastActive: '22 Sep 2026' },
  { id: 'USR-005', name: 'Communications Manager', email: 'comms@wista.example', role: 'COMMUNICATIONS_ADMIN', status: 'Inactive', lastActive: '18 Sep 2026' },
]

export const adminAuditLogs = [
  { id: 'AUD-001', timestamp: '24 Sep 2026, 10:20', actor: 'Sarah Tan', action: 'Application reviewed', module: 'Applications', status: 'Completed' },
  { id: 'AUD-002', timestamp: '23 Sep 2026, 16:30', actor: 'Finance Manager', action: 'Payment verified', module: 'Payments', status: 'Completed' },
  { id: 'AUD-003', timestamp: '22 Sep 2026, 11:15', actor: 'Events Manager', action: 'Event created', module: 'Events', status: 'Completed' },
  { id: 'AUD-004', timestamp: '21 Sep 2026, 09:45', actor: 'Membership Manager', action: 'Clarification requested', module: 'Applications', status: 'Completed' },
]
