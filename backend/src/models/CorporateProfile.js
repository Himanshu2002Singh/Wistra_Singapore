'use strict';

const { Model, DataTypes } = require('sequelize');

class CorporateProfile extends Model {
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
        company_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        company_description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        website: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        address: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        contact_email: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        contact_phone: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        invoicing_contact_person: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        main_contacts: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        additional_contacts: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'CorporateProfile',
        tableName: 'corporate_profiles',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );
  }

  static associate(models) {
    CorporateProfile.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'primaryContact',
    });
    CorporateProfile.hasMany(models.CorporateRepresentative, {
      foreignKey: 'corporate_profile_id',
      as: 'representatives',
    });
  }
}

module.exports = CorporateProfile;
