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
      image_url: { type: DataTypes.STRING(2048), allowNull: true },
      format: { type: DataTypes.ENUM('IN_PERSON', 'ONLINE', 'HYBRID'), allowNull: false, defaultValue: 'IN_PERSON' },
      starts_at: { type: DataTypes.DATE, allowNull: false },
      ends_at: { type: DataTypes.DATE, allowNull: true },
      registration_opens_at: { type: DataTypes.DATE, allowNull: true },
      registration_closes_at: { type: DataTypes.DATE, allowNull: true },
      capacity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'SGD' },
      is_free: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      member_price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      non_member_price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      status: { type: DataTypes.ENUM('DRAFT', 'PUBLISHED', 'CANCELLED'), allowNull: false, defaultValue: 'DRAFT' },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    }, {
      sequelize, modelName: 'Event', tableName: 'events', underscored: true, timestamps: true,
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    this.hasMany(models.EventRegistration, { foreignKey: 'event_id', as: 'registrations' });
  }
}

module.exports = Event;
