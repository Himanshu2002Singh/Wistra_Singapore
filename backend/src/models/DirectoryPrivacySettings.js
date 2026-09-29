'use strict';

const { Model, DataTypes } = require('sequelize');

class DirectoryPrivacySettings extends Model {
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
        show_email: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        show_phone: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        show_company: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        show_designation: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        show_bio: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        show_linkedin: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        show_photo: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
      },
      {
        sequelize,
        modelName: 'DirectoryPrivacySettings',
        tableName: 'directory_privacy_settings',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );
  }

  static associate(models) {
    DirectoryPrivacySettings.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  }
}

module.exports = DirectoryPrivacySettings;
