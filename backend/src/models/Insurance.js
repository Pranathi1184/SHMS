const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const Patient = require('./Patient');

class Insurance extends Model {}

Insurance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Patient,
        key: 'id',
      },
    },
    providerName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    policyNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    policyHolderName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    relationshipToPatient: {
      type: DataTypes.STRING(100),
    },
    coverageStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    coverageEndDate: {
      type: DataTypes.DATEONLY,
    },
    coverageDetails: {
      type: DataTypes.TEXT,
    },
  },
  {
    sequelize,
    modelName: 'Insurance',
    tableName: 'insurance',
    paranoid: true,
    indexes: [
      { fields: ['patient_id'] },
      { unique: true, fields: ['policy_number'] },
    ],
  }
);

Insurance.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Patient.hasMany(Insurance, { foreignKey: 'patientId', as: 'insuranceRecords' });

module.exports = Insurance;
