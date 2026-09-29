'use strict';

const { Model, DataTypes } = require('sequelize');

class Membership extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        user_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },
        application_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        membership_type: {
          type: DataTypes.ENUM('INDIVIDUAL', 'CORPORATE'),
          allowNull: false,
        },
        membership_number: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
        status: {
          type: DataTypes.ENUM(
            'PENDING',
            'APPROVED_PAYMENT_PENDING',
            'ACTIVE',
            'RENEWAL_DUE',
            'EXPIRED',
            'GRACE',
            'SUSPENDED',
            'CANCELLED'
          ),
          allowNull: false,
          defaultValue: 'PENDING',
        },
        start_date: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        end_date: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        fee: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0.00,
        },
        activated_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        activated_by: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        suspended_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        cancelled_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        cancellation_reason: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'Membership',
        tableName: 'memberships',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );
  }

  static associate(models) {
    Membership.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
    Membership.belongsTo(models.User, {
      foreignKey: 'activated_by',
      as: 'activator',
    });
    Membership.belongsTo(models.MembershipApplication, {
      foreignKey: 'application_id',
      as: 'application',
    });
    Membership.hasMany(models.MembershipStatusHistory, {
      foreignKey: 'membership_id',
      as: 'statusHistory',
    });
  }
}

module.exports = Membership;
