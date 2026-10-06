'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addIndex('memberships', ['created_at'], { name: 'idx_memberships_created_at' });
    await queryInterface.addIndex('membership_applications', ['created_at'], { name: 'idx_membership_applications_created_at' });
    await queryInterface.addIndex('payments', ['created_at'], { name: 'idx_payments_created_at' });
    await queryInterface.addIndex('invoices', ['created_at'], { name: 'idx_invoices_created_at' });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('memberships', 'idx_memberships_created_at');
    await queryInterface.removeIndex('membership_applications', 'idx_membership_applications_created_at');
    await queryInterface.removeIndex('payments', 'idx_payments_created_at');
    await queryInterface.removeIndex('invoices', 'idx_invoices_created_at');
  },
};
