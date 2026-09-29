'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('memberships', 'activated_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('memberships', 'activated_by', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('memberships', 'suspended_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('memberships', 'cancelled_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('memberships', 'cancellation_reason', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('memberships', 'cancellation_reason');
    await queryInterface.removeColumn('memberships', 'cancelled_at');
    await queryInterface.removeColumn('memberships', 'suspended_at');
    await queryInterface.removeColumn('memberships', 'activated_by');
    await queryInterface.removeColumn('memberships', 'activated_at');
  },
};
