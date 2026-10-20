'use strict';

const { Model, DataTypes } = require('sequelize');

class EventRegistration extends Model {
  static init(sequelize) {
    return super.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      event_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'REGISTERED' },
      payment_status: { type: DataTypes.ENUM('NOT_REQUIRED', 'AWAITING_PAYMENT', 'SUBMITTED', 'PAID', 'REJECTED'), allowNull: false, defaultValue: 'NOT_REQUIRED' },
      amount_due: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'SGD' },
      ticket_uid: { type: DataTypes.STRING(64), allowNull: true, unique: true },
      checked_in_at: { type: DataTypes.DATE, allowNull: true },
    }, {
      sequelize, modelName: 'EventRegistration', tableName: 'event_registrations', underscored: true, timestamps: true,
    });
  }

  static associate(models) {
    this.belongsTo(models.Event, { foreignKey: 'event_id', as: 'event' });
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'member' });
    this.hasOne(models.Payment, { foreignKey: 'event_registration_id', as: 'payment' });
    this.hasOne(models.Invoice, { foreignKey: 'event_registration_id', as: 'invoice' });
  }
}

module.exports = EventRegistration;
