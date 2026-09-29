'use strict';

const PERMISSIONS = [
  // Users management
  { name: 'users.view', description: 'View user accounts' },
  { name: 'users.read', description: 'Read user accounts' },
  { name: 'users.create', description: 'Create user accounts' },
  { name: 'users.update', description: 'Update user accounts' },
  { name: 'users.delete', description: 'Delete user accounts' },
  { name: 'users.manage', description: 'Full management of user accounts' },

  // Members management
  { name: 'members.view', description: 'View member profiles' },
  { name: 'members.read', description: 'Read member profiles' },
  { name: 'members.create', description: 'Create member records' },
  { name: 'members.update', description: 'Update member records' },
  { name: 'members.delete', description: 'Delete member records' },
  { name: 'members.approve', description: 'Approve membership applications' },
  { name: 'members.reject', description: 'Reject membership applications' },
  { name: 'members.suspend', description: 'Suspend active members' },
  { name: 'members.manage', description: 'Full management of members' },

  // Membership & Applications
  { name: 'applications.view', description: 'View membership applications' },
  { name: 'applications.read', description: 'Read membership applications' },
  { name: 'applications.approve', description: 'Approve membership applications' },
  { name: 'applications.reject', description: 'Reject membership applications' },
  { name: 'applications.manage', description: 'Full management of applications' },
  { name: 'membership.read', description: 'Read membership records' },
  { name: 'membership.manage', description: 'Full management of memberships' },

  // Payments & Invoices
  { name: 'payments.view', description: 'View payment records' },
  { name: 'payments.read', description: 'Read payment records' },
  { name: 'payments.create', description: 'Create payment records' },
  { name: 'payments.update', description: 'Update payment records' },
  { name: 'payments.refund', description: 'Process payment refunds' },
  { name: 'payments.manage', description: 'Full management of payments' },
  { name: 'invoices.read', description: 'Read invoice records' },
  { name: 'invoices.manage', description: 'Full management of invoices' },

  // Events & Registrations
  { name: 'events.view', description: 'View events' },
  { name: 'events.read', description: 'Read events' },
  { name: 'events.create', description: 'Create events' },
  { name: 'events.update', description: 'Update events' },
  { name: 'events.delete', description: 'Delete events' },
  { name: 'events.manage_registrations', description: 'Manage event registrations' },
  { name: 'events.checkin', description: 'Check in attendees at events' },
  { name: 'events.manage', description: 'Full management of events' },
  { name: 'registrations.read', description: 'Read event registrations' },
  { name: 'registrations.manage', description: 'Manage event registrations' },
  { name: 'attendance.read', description: 'Read attendance logs' },
  { name: 'attendance.manage', description: 'Manage event check-in/attendance' },

  // News & Communications & Campaigns
  { name: 'news.view', description: 'View news articles' },
  { name: 'news.read', description: 'Read news articles' },
  { name: 'news.create', description: 'Create news articles' },
  { name: 'news.update', description: 'Update news articles' },
  { name: 'news.delete', description: 'Delete news articles' },
  { name: 'news.publish', description: 'Publish news articles' },
  { name: 'news.manage', description: 'Full management of news' },
  { name: 'communications.view', description: 'View communications' },
  { name: 'communications.read', description: 'Read communications' },
  { name: 'communications.create', description: 'Create communications' },
  { name: 'communications.send', description: 'Send communications to members' },
  { name: 'communications.manage', description: 'Full management of communications' },
  { name: 'campaigns.read', description: 'Read marketing campaigns & newsletters' },
  { name: 'campaigns.manage', description: 'Manage campaigns & newsletters' },

  // Directory
  { name: 'directory.view', description: 'View the member directory' },
  { name: 'directory.read', description: 'Read member directory' },

  // Reports
  { name: 'reports.view', description: 'View reports and analytics' },
  { name: 'reports.read', description: 'Read reports and analytics' },
  { name: 'reports.export', description: 'Export reports' },

  // Settings
  { name: 'settings.view', description: 'View system settings' },
  { name: 'settings.read', description: 'Read system settings' },
  { name: 'settings.update', description: 'Update system settings' },
  { name: 'settings.manage', description: 'Full management of settings' },

  // Audit
  { name: 'audit_logs.view', description: 'View audit logs' },
  { name: 'audit_logs.read', description: 'Read audit logs' },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const records = PERMISSIONS.map((p) => ({
      name: p.name,
      description: p.description,
      created_at: now,
      updated_at: now,
    }));

    await queryInterface.bulkInsert('permissions', records, { ignoreDuplicates: true });
  },

  async down(queryInterface, Sequelize) {
    const names = PERMISSIONS.map((p) => p.name);
    await queryInterface.bulkDelete('permissions', { name: names });
  },
};
