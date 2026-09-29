'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('memberships', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      application_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: 'membership_applications',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      membership_type: {
        type: Sequelize.ENUM('INDIVIDUAL', 'CORPORATE'),
        allowNull: false,
      },
      membership_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      status: {
        type: Sequelize.ENUM(
          'PENDING',
          'APPROVED_PAYMENT_PENDING',
          'ACTIVE',
          'RENEWAL_DUE',
          'EXPIRED',
          'GRACE',
          'SUSPENDED',
          'CANCELLED'
        ),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('memberships', ['membership_number'], {
      name: 'idx_memberships_number',
      unique: true,
    });
    await queryInterface.addIndex('memberships', ['user_id'], {
      name: 'idx_memberships_user_id',
    });
    await queryInterface.addIndex('memberships', ['status'], {
      name: 'idx_memberships_status',
    });
    await queryInterface.addIndex('memberships', ['membership_type'], {
      name: 'idx_memberships_type',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('memberships');
  },
};
