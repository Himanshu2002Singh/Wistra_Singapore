'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert(
      'roles',
      [
        {
          name: 'SUPER_ADMIN',
          description: 'Full system access with all permissions',
          created_at: now,
          updated_at: now,
        },
        {
          name: 'MEMBERSHIP_ADMIN',
          description: 'Manages member applications, approvals, and membership lifecycle',
          created_at: now,
          updated_at: now,
        },
        {
          name: 'FINANCE_ADMIN',
          description: 'Manages payments, invoices, refunds, and financial reports',
          created_at: now,
          updated_at: now,
        },
        {
          name: 'EVENTS_ADMIN',
          description: 'Manages events, registrations, and check-ins',
          created_at: now,
          updated_at: now,
        },
        {
          name: 'COMMUNICATIONS_ADMIN',
          description: 'Manages news articles, communications, and publications',
          created_at: now,
          updated_at: now,
        },
        {
          name: 'MEMBER',
          description: 'Authenticated member with basic platform access',
          created_at: now,
          updated_at: now,
        },
      ],
      { ignoreDuplicates: true }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', {
      name: [
        'SUPER_ADMIN',
        'MEMBERSHIP_ADMIN',
        'FINANCE_ADMIN',
        'EVENTS_ADMIN',
        'COMMUNICATIONS_ADMIN',
        'MEMBER',
      ],
    });
  },
};
