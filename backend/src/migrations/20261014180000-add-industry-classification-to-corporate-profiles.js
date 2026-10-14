'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('corporate_profiles', 'industry_main_category', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn('corporate_profiles', 'industry_sub_category', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('corporate_profiles', 'industry_sub_category');
    await queryInterface.removeColumn('corporate_profiles', 'industry_main_category');
  },
};
