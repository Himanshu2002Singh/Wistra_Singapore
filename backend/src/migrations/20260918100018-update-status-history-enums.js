'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      'ALTER TABLE `membership_status_history` MODIFY COLUMN `old_status` VARCHAR(50) NULL;'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE `membership_status_history` MODIFY COLUMN `new_status` VARCHAR(50) NOT NULL;'
    );
  },

  async down(queryInterface, Sequelize) {
    // Keep VARCHAR for safety
  },
};
