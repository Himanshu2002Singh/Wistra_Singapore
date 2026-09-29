'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const statusEnumValues = [
      'PENDING',
      'APPROVED_PAYMENT_PENDING',
      'ACTIVE',
      'RENEWAL_DUE',
      'EXPIRED',
      'GRACE',
      'SUSPENDED',
      'CANCELLED',
    ];

    await queryInterface.createTable('membership_status_history', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      membership_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'memberships',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      old_status: {
        type: Sequelize.ENUM(...statusEnumValues),
        allowNull: true,
      },
      new_status: {
        type: Sequelize.ENUM(...statusEnumValues),
        allowNull: false,
      },
      changed_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('membership_status_history', ['membership_id'], {
      name: 'idx_status_history_membership_id',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('membership_status_history');
  },
};
