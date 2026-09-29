'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('individual_profiles', 'nationality', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'photo_url',
    });
    await queryInterface.addColumn('individual_profiles', 'date_of_birth', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      after: 'nationality',
    });
    await queryInterface.addColumn('individual_profiles', 'invoicing_address', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'date_of_birth',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('individual_profiles', 'invoicing_address');
    await queryInterface.removeColumn('individual_profiles', 'date_of_birth');
    await queryInterface.removeColumn('individual_profiles', 'nationality');
  },
};
