'use strict';

const { Model, DataTypes } = require('sequelize');

class MembershipApplication extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        application_number: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
        user_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        membership_type: {
          type: DataTypes.ENUM('INDIVIDUAL', 'CORPORATE'),
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM(
            'DRAFT',
            'PENDING',
            'UNDER_REVIEW',
            'CLARIFICATION_REQUIRED',
            'APPROVED',
            'REJECTED',
            'PAYMENT_PENDING'
          ),
          allowNull: false,
          defaultValue: 'PENDING',
        },
        submitted_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        reviewed_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        reviewed_by: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        review_remarks: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        approved_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        rejected_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'MembershipApplication',
        tableName: 'membership_applications',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );
  }

  static associate(models) {
    MembershipApplication.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'applicant',
    });
    MembershipApplication.belongsTo(models.User, {
      foreignKey: 'reviewed_by',
      as: 'reviewer',
    });
    MembershipApplication.hasOne(models.Membership, {
      foreignKey: 'application_id',
      as: 'membership',
    });
  }
}

module.exports = MembershipApplication;
