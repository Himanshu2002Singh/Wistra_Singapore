'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      payment_reference: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
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
      membership_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: 'memberships',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'SGD',
      },
      payment_method: {
        type: Sequelize.ENUM('BANK_TRANSFER', 'PAYNOW', 'CARD', 'COMPLIMENTARY', 'OTHER'),
        allowNull: false,
        defaultValue: 'BANK_TRANSFER',
      },
      payment_status: {
        type: Sequelize.ENUM(
          'PENDING',
          'SUBMITTED',
          'UNDER_VERIFICATION',
          'PAID',
          'FAILED',
          'REJECTED',
          'REFUNDED',
          'CANCELLED'
        ),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      transaction_reference: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      paid_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      verified_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      verified_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      failure_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    await queryInterface.addIndex('payments', ['user_id']);
    await queryInterface.addIndex('payments', ['application_id']);
    await queryInterface.addIndex('payments', ['payment_status']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('payments');
  },
};
