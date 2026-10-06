'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('events', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      title: { type: Sequelize.STRING(180), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      event_type: { type: Sequelize.STRING(80), allowNull: false },
      location: { type: Sequelize.STRING(255), allowNull: false },
      starts_at: { type: Sequelize.DATE, allowNull: false },
      ends_at: { type: Sequelize.DATE, allowNull: true },
      status: { type: Sequelize.ENUM('DRAFT', 'PUBLISHED', 'CANCELLED'), allowNull: false, defaultValue: 'DRAFT' },
      created_by: {
        type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('events', ['starts_at'], { name: 'idx_events_starts_at' });
    await queryInterface.addIndex('events', ['status'], { name: 'idx_events_status' });

    await queryInterface.createTable('news_articles', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      title: { type: Sequelize.STRING(180), allowNull: false },
      excerpt: { type: Sequelize.STRING(500), allowNull: false },
      content: { type: Sequelize.TEXT('long'), allowNull: false },
      category: { type: Sequelize.STRING(80), allowNull: false },
      author: { type: Sequelize.STRING(150), allowNull: false },
      image_url: { type: Sequelize.STRING(2048), allowNull: true },
      status: { type: Sequelize.ENUM('DRAFT', 'PUBLISHED'), allowNull: false, defaultValue: 'DRAFT' },
      published_at: { type: Sequelize.DATE, allowNull: true },
      created_by: {
        type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('news_articles', ['status', 'published_at'], { name: 'idx_news_articles_publication' });
    await queryInterface.addIndex('news_articles', ['category'], { name: 'idx_news_articles_category' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('news_articles');
    await queryInterface.dropTable('events');
  },
};
