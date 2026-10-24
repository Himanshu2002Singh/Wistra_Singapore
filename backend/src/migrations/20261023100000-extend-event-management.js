'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('events', 'image_url', { type: Sequelize.STRING(2048), allowNull: true });
    await queryInterface.addColumn('events', 'format', { type: Sequelize.ENUM('IN_PERSON', 'ONLINE', 'HYBRID'), allowNull: false, defaultValue: 'IN_PERSON' });
    await queryInterface.addColumn('events', 'registration_opens_at', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn('events', 'registration_closes_at', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn('events', 'capacity', { type: Sequelize.INTEGER.UNSIGNED, allowNull: true });
    await queryInterface.addColumn('events', 'currency', { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'SGD' });
    await queryInterface.addColumn('event_registrations', 'checked_in_by', {
      type: Sequelize.BIGINT.UNSIGNED, allowNull: true,
      references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
    });
    await queryInterface.addIndex('events', ['status', 'registration_opens_at', 'registration_closes_at'], { name: 'idx_events_registration_window' });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('events', 'idx_events_registration_window');
    await queryInterface.removeColumn('event_registrations', 'checked_in_by');
    await queryInterface.removeColumn('events', 'currency');
    await queryInterface.removeColumn('events', 'capacity');
    await queryInterface.removeColumn('events', 'registration_closes_at');
    await queryInterface.removeColumn('events', 'registration_opens_at');
    await queryInterface.removeColumn('events', 'format');
    await queryInterface.removeColumn('events', 'image_url');
  },
};
