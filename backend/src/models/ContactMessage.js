'use strict';

const { Model, DataTypes } = require('sequelize');

class ContactMessage extends Model {
  static init(sequelize) {
    return super.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      name: { type: DataTypes.STRING(100), allowNull: false },
      email: { type: DataTypes.STRING(255), allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: false },
      status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'NEW' },
    }, {
      sequelize, modelName: 'ContactMessage', tableName: 'contact_messages', underscored: true, timestamps: true,
    });
  }
}

module.exports = ContactMessage;
