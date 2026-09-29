'use strict';

const { Model, DataTypes } = require('sequelize');

class Invoice extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        invoice_number: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
        payment_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        application_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        user_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },
        membership_type: {
          type: DataTypes.ENUM('INDIVIDUAL', 'CORPORATE'),
          allowNull: false,
        },
        subtotal: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        discount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0.00,
        },
        total: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        currency: {
          type: DataTypes.STRING(3),
          allowNull: false,
          defaultValue: 'SGD',
        },
        status: {
          type: DataTypes.ENUM('DRAFT', 'ISSUED', 'PAID', 'VOID', 'REFUNDED'),
          allowNull: false,
          defaultValue: 'ISSUED',
        },
        issued_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        due_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        paid_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'Invoice',
        tableName: 'invoices',
        underscored: true,
        timestamps: true,
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    this.belongsTo(models.Payment, { foreignKey: 'payment_id', as: 'payment' });
    this.belongsTo(models.MembershipApplication, { foreignKey: 'application_id', as: 'application' });
  }
}

module.exports = Invoice;
