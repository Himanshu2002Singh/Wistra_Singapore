'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Modify membership_id to allow NULL so application status history can be recorded before membership creation
    await queryInterface.changeColumn('membership_status_history', 'membership_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      references: {
        model: 'memberships',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    // Add application_id referencing membership_applications(id)
    await queryInterface.addColumn('membership_status_history', 'application_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      references: {
        model: 'membership_applications',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      after: 'membership_id',
    });

    await queryInterface.addIndex('membership_status_history', ['application_id'], {
      name: 'idx_status_history_application_id',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('membership_status_history', 'idx_status_history_application_id');
    await queryInterface.removeColumn('membership_status_history', 'application_id');
    await queryInterface.changeColumn('membership_status_history', 'membership_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'memberships',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },
};
