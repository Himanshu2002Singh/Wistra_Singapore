'use strict';

const { Model, DataTypes } = require('sequelize');

class CorporateRepresentative extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        corporate_profile_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },
        user_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        phone: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        designation: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        is_primary: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        status: {
          type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
          allowNull: false,
          defaultValue: 'ACTIVE',
        },
      },
      {
        sequelize,
        modelName: 'CorporateRepresentative',
        tableName: 'corporate_representatives',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );
  }

  static associate(models) {
    CorporateRepresentative.belongsTo(models.CorporateProfile, {
      foreignKey: 'corporate_profile_id',
      as: 'corporateProfile',
    });
    CorporateRepresentative.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  }
}

module.exports = CorporateRepresentative;
