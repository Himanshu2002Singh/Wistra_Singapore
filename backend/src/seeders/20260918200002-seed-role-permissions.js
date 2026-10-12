'use strict';

/**
 * Role-Permission mapping for WISTA Singapore based on Phase 4 Permission Matrix.
 *
 * SUPER_ADMIN          → '*' (All permissions)
 * MEMBERSHIP_ADMIN     → Applications + Members + Membership + Directory + Reports
 * FINANCE_ADMIN        → Payments + Invoices + Financial Reports + Directory
 * EVENTS_ADMIN         → Events + Registrations + Attendance + Event Reports + Directory
 * COMMUNICATIONS_ADMIN → Communications + News + Campaigns + Communication Reports + Directory
 * MEMBER               → Basic member-facing access (Events View, News View, Directory View)
 */

const ROLE_PERMISSION_MAP = {
  SUPER_ADMIN: '*',

  MEMBERSHIP_ADMIN: [
    'users.view',
    'users.read',
    'members.view',
    'members.read',
    'members.create',
    'members.update',
    'members.delete',
    'members.approve',
    'members.reject',
    'members.suspend',
    'members.manage',
    'applications.view',
    'applications.read',
    'applications.approve',
    'applications.reject',
    'applications.manage',
    'membership.read',
    'membership.manage',
    'directory.view',
    'directory.read',
    'reports.view',
    'reports.read',
    'reports.export',
  ],

  FINANCE_ADMIN: [
    'payments.view',
    'payments.read',
    'payments.create',
    'payments.update',
    'payments.refund',
    'payments.manage',
    'invoices.read',
    'invoices.manage',
    'reports.view',
    'reports.read',
    'reports.export',
    'directory.view',
    'directory.read',
  ],

  EVENTS_ADMIN: [
    'events.view',
    'events.read',
    'events.create',
    'events.update',
    'events.delete',
    'events.manage_registrations',
    'events.checkin',
    'events.manage',
    'registrations.read',
    'registrations.manage',
    'attendance.read',
    'attendance.manage',
    'directory.view',
    'directory.read',
    'reports.view',
    'reports.read',
  ],

  COMMUNICATIONS_ADMIN: [
    'news.view',
    'news.read',
    'news.create',
    'news.update',
    'news.delete',
    'news.publish',
    'news.manage',
    'communications.view',
    'communications.read',
    'communications.create',
    'communications.send',
    'communications.manage',
    'campaigns.read',
    'campaigns.manage',
    'directory.view',
    'directory.read',
    'reports.view',
    'reports.read',
  ],

  MEMBER: [
    'events.view',
    'events.read',
    'news.view',
    'news.read',
    'directory.view',
    'directory.read',
  ],
};

const getSeededMappings = async (queryInterface, Sequelize) => {
  const roles = await queryInterface.sequelize.query(
    'SELECT id, name FROM roles WHERE name IN (:names)',
    { replacements: { names: Object.keys(ROLE_PERMISSION_MAP) }, type: Sequelize.QueryTypes.SELECT }
  );
  const permissions = await queryInterface.sequelize.query(
    'SELECT id, name FROM permissions',
    { type: Sequelize.QueryTypes.SELECT }
  );
  const roleMap = Object.fromEntries(roles.map(({ id, name }) => [name, id]));
  const permissionMap = Object.fromEntries(permissions.map(({ id, name }) => [name, id]));
  const now = new Date();
  const records = [];

  for (const [roleName, rolePermissions] of Object.entries(ROLE_PERMISSION_MAP)) {
    const roleId = roleMap[roleName];
    if (!roleId) continue;
    const permissionIds = rolePermissions === '*'
      ? permissions.map(({ id }) => id)
      : rolePermissions.map((permissionName) => permissionMap[permissionName]).filter(Boolean);
    for (const permissionId of permissionIds) {
      records.push({ role_id: roleId, permission_id: permissionId, created_at: now, updated_at: now });
    }
  }
  return records;
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const records = await getSeededMappings(queryInterface, Sequelize);

    if (records.length > 0) {
      await queryInterface.bulkInsert('role_permissions', records, { ignoreDuplicates: true });
    }
  },

  async down(queryInterface, Sequelize) {
    const records = await getSeededMappings(queryInterface, Sequelize);
    if (records.length) {
      await queryInterface.bulkDelete('role_permissions', {
        [Sequelize.Op.or]: records.map(({ role_id, permission_id }) => ({ role_id, permission_id })),
      });
    }
  },
};
