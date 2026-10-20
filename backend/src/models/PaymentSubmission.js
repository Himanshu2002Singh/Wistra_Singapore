'use strict';

const { Model, DataTypes } = require('sequelize');

class PaymentSubmission extends Model {
  static init(sequelize) {
    return super.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      payment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      payment_method: { type: DataTypes.ENUM('BANK_TRANSFER', 'PAYNOW'), allowNull: false },
      transaction_reference: { type: DataTypes.STRING(100), allowNull: false },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      transfer_date: { type: DataTypes.DATEONLY, allowNull: false },
      proof_storage_key: { type: DataTypes.STRING(100), allowNull: false },
      proof_original_name: { type: DataTypes.STRING(255), allowNull: false },
      proof_mime_type: { type: DataTypes.STRING(100), allowNull: false },
      proof_size: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      status: { type: DataTypes.ENUM('SUBMITTED', 'VERIFIED', 'REJECTED'), allowNull: false, defaultValue: 'SUBMITTED' },
      review_reason: { type: DataTypes.TEXT, allowNull: true },
      reviewed_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      reviewed_at: { type: DataTypes.DATE, allowNull: true },
    }, { sequelize, modelName: 'PaymentSubmission', tableName: 'payment_submissions', underscored: true, timestamps: true });
  }

  static associate(models) {
    this.belongsTo(models.Payment, { foreignKey: 'payment_id', as: 'payment' });
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'submitter' });
    this.belongsTo(models.User, { foreignKey: 'reviewed_by', as: 'reviewer' });
  }
}

module.exports = PaymentSubmission;
