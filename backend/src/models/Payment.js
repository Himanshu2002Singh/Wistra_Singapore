'use strict';

const { Model, DataTypes } = require('sequelize');

class Payment extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        payment_reference: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
        application_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        user_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },
        membership_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        amount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        currency: {
          type: DataTypes.STRING(3),
          allowNull: false,
          defaultValue: 'SGD',
        },
        payment_method: {
          type: DataTypes.ENUM('BANK_TRANSFER', 'PAYNOW', 'CARD', 'COMPLIMENTARY', 'OTHER'),
          allowNull: false,
          defaultValue: 'BANK_TRANSFER',
        },
        payment_status: {
          type: DataTypes.ENUM(
            'PENDING',
            'SUBMITTED',
            'UNDER_VERIFICATION',
            'PAID',
            'FAILED',
            'REJECTED',
            'REFUNDED',
            'CANCELLED'
          ),
          allowNull: false,
          defaultValue: 'PENDING',
        },
        transaction_reference: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        paid_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        verified_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        verified_by: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        failure_reason: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'Payment',
        tableName: 'payments',
        underscored: true,
        timestamps: true,
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    this.belongsTo(models.User, { foreignKey: 'verified_by', as: 'verifier' });
    this.belongsTo(models.MembershipApplication, { foreignKey: 'application_id', as: 'application' });
    this.belongsTo(models.Membership, { foreignKey: 'membership_id', as: 'membership' });
    this.hasOne(models.Invoice, { foreignKey: 'payment_id', as: 'invoice' });
  }
}

module.exports = Payment;
