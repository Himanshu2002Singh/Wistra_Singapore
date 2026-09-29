'use strict';

const { Model, DataTypes } = require('sequelize');

class MembershipStatusHistory extends Model {
  static init(sequelize) {
    const statusEnumValues = [
      'DRAFT',
      'PENDING',
      'UNDER_REVIEW',
      'CLARIFICATION_REQUIRED',
      'APPROVED',
      'REJECTED',
      'APPROVED_PAYMENT_PENDING',
      'PAYMENT_PENDING',
      'ACTIVE',
      'RENEWAL_DUE',
      'EXPIRED',
      'GRACE',
      'SUSPENDED',
      'CANCELLED',
    ];

    return super.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        membership_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        application_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        old_status: {
          type: DataTypes.ENUM(...statusEnumValues),
          allowNull: true,
        },
        new_status: {
          type: DataTypes.ENUM(...statusEnumValues),
          allowNull: false,
        },
        changed_by: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        reason: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'MembershipStatusHistory',
        tableName: 'membership_status_history',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
      }
    );
  }

  static associate(models) {
    MembershipStatusHistory.belongsTo(models.Membership, {
      foreignKey: 'membership_id',
      as: 'membership',
    });
    MembershipStatusHistory.belongsTo(models.MembershipApplication, {
      foreignKey: 'application_id',
      as: 'application',
    });
    MembershipStatusHistory.belongsTo(models.User, {
      foreignKey: 'changed_by',
      as: 'changedByUser',
    });
  }
}

module.exports = MembershipStatusHistory;
