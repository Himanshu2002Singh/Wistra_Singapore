'use strict';

const { Model, DataTypes } = require('sequelize');

class NewsArticle extends Model {
  static init(sequelize) {
    return super.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      title: { type: DataTypes.STRING(180), allowNull: false },
      excerpt: { type: DataTypes.STRING(500), allowNull: false },
      content: { type: DataTypes.TEXT('long'), allowNull: false },
      category: { type: DataTypes.STRING(80), allowNull: false },
      author: { type: DataTypes.STRING(150), allowNull: false },
      image_url: { type: DataTypes.STRING(2048), allowNull: true },
      status: { type: DataTypes.ENUM('DRAFT', 'PUBLISHED'), allowNull: false, defaultValue: 'DRAFT' },
      published_at: { type: DataTypes.DATE, allowNull: true },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    }, {
      sequelize, modelName: 'NewsArticle', tableName: 'news_articles', underscored: true, timestamps: true,
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
  }
}

module.exports = NewsArticle;
