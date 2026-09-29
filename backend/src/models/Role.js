'use strict';

const { Model, DataTypes } = require('sequelize');

class Role extends Model {
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
          type: DataTypes.STRING(50),
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
        modelName: 'Role',
        tableName: 'roles',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );
  }

  static associate(models) {
    Role.hasMany(models.User, {
      foreignKey: 'role_id',
      as: 'users',
    });

    Role.belongsToMany(models.User, {
      through: 'user_roles',
      foreignKey: 'role_id',
      otherKey: 'user_id',
      as: 'userRoles',
      timestamps: true,
    });

    Role.belongsToMany(models.Permission, {
      through: 'role_permissions',
      foreignKey: 'role_id',
      otherKey: 'permission_id',
      as: 'permissions',
      timestamps: true,
    });
  }
}

module.exports = Role;
