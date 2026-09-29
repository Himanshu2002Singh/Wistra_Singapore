'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('corporate_profiles', 'invoicing_contact_person', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'contact_phone',
    });
    await queryInterface.addColumn('corporate_profiles', 'main_contacts', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'invoicing_contact_person',
    });
    await queryInterface.addColumn('corporate_profiles', 'additional_contacts', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'main_contacts',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('corporate_profiles', 'additional_contacts');
    await queryInterface.removeColumn('corporate_profiles', 'main_contacts');
    await queryInterface.removeColumn('corporate_profiles', 'invoicing_contact_person');
  },
};
