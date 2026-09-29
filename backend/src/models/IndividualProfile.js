'use strict';

const { Model, DataTypes } = require('sequelize');

class IndividualProfile extends Model {
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
          unique: true,
        },
        company: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        designation: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        biography: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        linkedin_url: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        photo_url: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        nationality: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        date_of_birth: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        invoicing_address: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'IndividualProfile',
        tableName: 'individual_profiles',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );
  }

  static associate(models) {
    IndividualProfile.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  }
}

module.exports = IndividualProfile;
