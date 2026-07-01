const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const Patient = require('./Patient');
const Doctor = require('./Doctor');
const User = require('./User');
const EHR = require('./EHR');

class Prescription extends Model {}

Prescription.init(
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
    doctorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Doctor,
        key: 'id',
      },
    },
    ehrId: {
      type: DataTypes.UUID,
      references: {
        model: EHR,
        key: 'id',
      },
    },
    prescriptionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    notes: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Dispensed', 'Cancelled'),
      defaultValue: 'Pending',
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Prescription',
    tableName: 'prescriptions',
    paranoid: true,
    indexes: [
      { fields: ['patient_id'] },
      { fields: ['doctor_id'] },
      { fields: ['ehr_id'] },
      { fields: ['status'] },
    ],
  }
);

Prescription.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Prescription.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });
Prescription.belongsTo(EHR, { foreignKey: 'ehrId', as: 'ehr' });
Prescription.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Patient.hasMany(Prescription, { foreignKey: 'patientId', as: 'prescriptions' });
Doctor.hasMany(Prescription, { foreignKey: 'doctorId', as: 'prescriptions' });
EHR.hasMany(Prescription, { foreignKey: 'ehrId', as: 'prescriptions' });

module.exports = Prescription;
