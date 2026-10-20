'use strict';

const { Model, DataTypes } = require('sequelize');

class PasswordResetToken extends Model {
  static init(sequelize) {
    return super.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      token_hash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      used_at: { type: DataTypes.DATE, allowNull: true },
    }, {
      sequelize, modelName: 'PasswordResetToken', tableName: 'password_reset_tokens', underscored: true, timestamps: true,
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  }
}

module.exports = PasswordResetToken;
