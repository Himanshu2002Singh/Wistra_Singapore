'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('event_registrations', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      event_id: {
        type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'events', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      status: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'REGISTERED' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('event_registrations', ['user_id', 'event_id'], {
      unique: true, name: 'uq_event_registrations_user_event',
    });
    await queryInterface.addIndex('event_registrations', ['event_id', 'created_at'], {
      name: 'idx_event_registrations_event_created',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('event_registrations');
  },
};
