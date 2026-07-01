const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const Patient = require('./Patient');
const Doctor = require('./Doctor');
const User = require('./User');

class EHR extends Model {}

EHR.init(
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
    appointmentId: {
      type: DataTypes.UUID,
      references: {
        model: require('./Appointment'),
        key: 'id',
      },
    },
    diagnosis: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    symptoms: {
      type: DataTypes.TEXT,
    },
    treatmentPlan: {
      type: DataTypes.TEXT,
    },
    notes: {
      type: DataTypes.TEXT,
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
    modelName: 'EHR',
    tableName: 'ehr',
    paranoid: true,
    indexes: [
      { fields: ['patient_id'] },
      { fields: ['doctor_id'] },
      { fields: ['appointment_id'] },
    ],
  }
);

EHR.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
EHR.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });
EHR.belongsTo(require('./Appointment'), { foreignKey: 'appointmentId', as: 'appointment' });
EHR.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Patient.hasMany(EHR, { foreignKey: 'patientId', as: 'ehrRecords' });
Doctor.hasMany(EHR, { foreignKey: 'doctorId', as: 'ehrRecords' });
require('./Appointment').hasMany(EHR, { foreignKey: 'appointmentId', as: 'ehrRecords' });

module.exports = EHR;
