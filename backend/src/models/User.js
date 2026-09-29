'use strict';

const { Model, DataTypes } = require('sequelize');

class User extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        first_name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        last_name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
        },
        password_hash: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        phone: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        profile_photo: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
          allowNull: false,
          defaultValue: 'ACTIVE',
        },
        role_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        last_login_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );
  }

  static associate(models) {
    User.belongsTo(models.Role, {
      foreignKey: 'role_id',
      as: 'role',
    });

    User.belongsToMany(models.Role, {
      through: 'user_roles',
      foreignKey: 'user_id',
      otherKey: 'role_id',
      as: 'roles',
      timestamps: true,
    });

    User.hasOne(models.IndividualProfile, {
      foreignKey: 'user_id',
      as: 'individualProfile',
    });

    User.hasOne(models.CorporateProfile, {
      foreignKey: 'user_id',
      as: 'corporateProfile',
    });

    User.hasOne(models.CorporateRepresentative, {
      foreignKey: 'user_id',
      as: 'representativeInfo',
    });

    User.hasMany(models.MembershipApplication, {
      foreignKey: 'user_id',
      as: 'applications',
    });

    User.hasMany(models.Membership, {
      foreignKey: 'user_id',
      as: 'memberships',
    });

    User.hasOne(models.DirectoryPrivacySettings, {
      foreignKey: 'user_id',
      as: 'privacySettings',
    });

    User.hasMany(models.AuditLog, {
      foreignKey: 'user_id',
      as: 'auditLogs',
    });
  }
}

module.exports = User;
