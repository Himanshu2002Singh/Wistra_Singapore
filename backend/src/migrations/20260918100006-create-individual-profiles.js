'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('individual_profiles', {
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
      company: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      designation: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      biography: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      linkedin_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      photo_url: {
        type: Sequelize.STRING(500),
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

    await queryInterface.addIndex('individual_profiles', ['user_id'], {
      name: 'idx_individual_profiles_user_id',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('individual_profiles');
  },
};
