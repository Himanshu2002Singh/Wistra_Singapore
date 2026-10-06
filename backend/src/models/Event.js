'use strict';

const { Model, DataTypes } = require('sequelize');

class Event extends Model {
  static init(sequelize) {
    return super.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      title: { type: DataTypes.STRING(180), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      event_type: { type: DataTypes.STRING(80), allowNull: false },
      location: { type: DataTypes.STRING(255), allowNull: false },
      starts_at: { type: DataTypes.DATE, allowNull: false },
      ends_at: { type: DataTypes.DATE, allowNull: true },
      status: { type: DataTypes.ENUM('DRAFT', 'PUBLISHED', 'CANCELLED'), allowNull: false, defaultValue: 'DRAFT' },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    }, {
      sequelize, modelName: 'Event', tableName: 'events', underscored: true, timestamps: true,
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
  }
}

module.exports = Event;
