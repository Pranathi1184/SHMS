const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Patient extends Model {}

Patient.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM('Male', 'Female', 'Other'),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
    },
    bloodType: {
      type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    },
    allergies: {
      type: DataTypes.TEXT,
    },
    emergencyContactName: {
      type: DataTypes.STRING(100),
    },
    emergencyContactPhone: {
      type: DataTypes.STRING(20),
    },
  },
  {
    sequelize,
    modelName: 'Patient',
    tableName: 'patients',
    paranoid: true,
    indexes: [
      { unique: true, fields: ['email'] },
      { fields: ['phone'] },
      { fields: ['last_name', 'first_name'] },
    ],
  }
);

module.exports = Patient;
