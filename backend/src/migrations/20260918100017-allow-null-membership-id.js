'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      'ALTER TABLE `membership_status_history` MODIFY COLUMN `membership_id` BIGINT UNSIGNED NULL;'
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      'ALTER TABLE `membership_status_history` MODIFY COLUMN `membership_id` BIGINT UNSIGNED NOT NULL;'
    );
  },
};
