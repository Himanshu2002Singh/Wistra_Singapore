'use strict';

const { Model, DataTypes } = require('sequelize');

class StudentProfile extends Model {
  static init(sequelize) {
    return super.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      application_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: true },
      first_name: { type: DataTypes.STRING(100), allowNull: false },
      last_name: { type: DataTypes.STRING(100), allowNull: false },
      email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      mobile_number: { type: DataTypes.STRING(30), allowNull: false },
      invoicing_address: { type: DataTypes.TEXT, allowNull: false },
      nationality: { type: DataTypes.STRING(100), allowNull: false },
      date_of_birth: { type: DataTypes.DATEONLY, allowNull: false },
      institution_name: { type: DataTypes.STRING(255), allowNull: false },
      degree_type: { type: DataTypes.STRING(150), allowNull: false },
      field_of_study: { type: DataTypes.STRING(255), allowNull: false },
      enrollment_type: { type: DataTypes.ENUM('FULL_TIME', 'PART_TIME'), allowNull: false },
      graduation_month: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
      graduation_year: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
      document_storage_key: { type: DataTypes.STRING(100), allowNull: false },
      document_original_name: { type: DataTypes.STRING(255), allowNull: false },
      document_mime_type: { type: DataTypes.STRING(50), allowNull: false },
      document_size: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    }, {
      sequelize,
      modelName: 'StudentProfile',
      tableName: 'student_profiles',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    });
  }

  static associate(models) {
    StudentProfile.belongsTo(models.MembershipApplication, { foreignKey: 'application_id', as: 'application' });
  }
}

module.exports = StudentProfile;
