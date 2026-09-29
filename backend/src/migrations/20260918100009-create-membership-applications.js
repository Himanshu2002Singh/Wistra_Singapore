'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('membership_applications', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      application_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      membership_type: {
        type: Sequelize.ENUM('INDIVIDUAL', 'CORPORATE'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(
          'PENDING',
          'UNDER_REVIEW',
          'APPROVED',
          'REJECTED',
          'CLARIFICATION_REQUIRED',
          'PAYMENT_PENDING'
        ),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      reviewed_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      review_remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      rejected_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('membership_applications', ['application_number'], {
      name: 'idx_applications_app_number',
      unique: true,
    });
    await queryInterface.addIndex('membership_applications', ['user_id'], {
      name: 'idx_applications_user_id',
    });
    await queryInterface.addIndex('membership_applications', ['status'], {
      name: 'idx_applications_status',
    });
    await queryInterface.addIndex('membership_applications', ['membership_type'], {
      name: 'idx_applications_type',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('membership_applications');
  },
};
