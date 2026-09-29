'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('directory_privacy_settings', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      show_email: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      show_phone: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      show_company: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      show_designation: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      show_bio: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      show_linkedin: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      show_photo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    await queryInterface.addIndex('directory_privacy_settings', ['user_id'], {
      name: 'idx_privacy_settings_user_id',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('directory_privacy_settings');
  },
};
