'use strict';

const { Model, DataTypes } = require('sequelize');

class AuditLog extends Model {
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
          allowNull: true,
        },
        action: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        module: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        entity_type: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        entity_id: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        old_values: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        new_values: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        ip_address: {
          type: DataTypes.STRING(45),
          allowNull: true,
        },
        user_agent: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'AuditLog',
        tableName: 'audit_logs',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
      }
    );
  }

  static associate(models) {
    AuditLog.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  }
}

module.exports = AuditLog;
