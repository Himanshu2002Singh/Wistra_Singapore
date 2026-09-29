'use strict';

const { Model, DataTypes } = require('sequelize');

class Permission extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
        },
        description: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'Permission',
        tableName: 'permissions',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );
  }

  static associate(models) {
    Permission.belongsToMany(models.Role, {
      through: 'role_permissions',
      foreignKey: 'permission_id',
      otherKey: 'role_id',
      as: 'roles',
      timestamps: true,
    });
  }
}

module.exports = Permission;
