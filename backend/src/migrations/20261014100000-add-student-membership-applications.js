'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('membership_applications', 'membership_type', {
      type: Sequelize.ENUM('INDIVIDUAL', 'CORPORATE', 'STUDENT'), allowNull: false,
    });
    await queryInterface.changeColumn('memberships', 'membership_type', {
      type: Sequelize.ENUM('INDIVIDUAL', 'CORPORATE', 'STUDENT'), allowNull: false,
    });
    await queryInterface.changeColumn('invoices', 'membership_type', {
      type: Sequelize.ENUM('INDIVIDUAL', 'CORPORATE', 'STUDENT'), allowNull: false,
    });
    await queryInterface.createTable('student_profiles', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      application_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, unique: true, references: { model: 'membership_applications', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      first_name: { type: Sequelize.STRING(100), allowNull: false },
      last_name: { type: Sequelize.STRING(100), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      mobile_number: { type: Sequelize.STRING(30), allowNull: false },
      invoicing_address: { type: Sequelize.TEXT, allowNull: false },
      nationality: { type: Sequelize.STRING(100), allowNull: false },
      date_of_birth: { type: Sequelize.DATEONLY, allowNull: false },
      institution_name: { type: Sequelize.STRING(255), allowNull: false },
      degree_type: { type: Sequelize.STRING(150), allowNull: false },
      field_of_study: { type: Sequelize.STRING(255), allowNull: false },
      enrollment_type: { type: Sequelize.ENUM('FULL_TIME', 'PART_TIME'), allowNull: false },
      graduation_month: { type: Sequelize.TINYINT.UNSIGNED, allowNull: false },
      graduation_year: { type: Sequelize.SMALLINT.UNSIGNED, allowNull: false },
      document_storage_key: { type: Sequelize.STRING(100), allowNull: false },
      document_original_name: { type: Sequelize.STRING(255), allowNull: false },
      document_mime_type: { type: Sequelize.STRING(50), allowNull: false },
      document_size: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('student_profiles');
    await queryInterface.changeColumn('invoices', 'membership_type', { type: Sequelize.ENUM('INDIVIDUAL', 'CORPORATE'), allowNull: false });
    await queryInterface.changeColumn('memberships', 'membership_type', { type: Sequelize.ENUM('INDIVIDUAL', 'CORPORATE'), allowNull: false });
    await queryInterface.changeColumn('membership_applications', 'membership_type', { type: Sequelize.ENUM('INDIVIDUAL', 'CORPORATE'), allowNull: false });
  },
};
