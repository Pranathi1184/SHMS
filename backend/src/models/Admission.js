const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const Patient = require('./Patient');
const Doctor = require('./Doctor');
const Bed = require('./Bed');
const User = require('./User');

class Admission extends Model {}

Admission.init(
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
    bedId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Bed,
        key: 'id',
      },
    },
    admissionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    dischargeDate: {
      type: DataTypes.DATE,
    },
    reasonForAdmission: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Admitted', 'Discharged', 'Transferred'),
      defaultValue: 'Admitted',
    },
    notes: {
      type: DataTypes.TEXT,
    },
    admittedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    dischargedBy: {
      type: DataTypes.UUID,
      references: {
        model: User,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Admission',
    tableName: 'admissions',
    indexes: [
      { fields: ['patient_id'] },
      { fields: ['doctor_id'] },
      { fields: ['bed_id'] },
      { fields: ['status'] },
      { fields: ['admission_date'] },
    ],
  }
);

Admission.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Admission.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });
Admission.belongsTo(Bed, { foreignKey: 'bedId', as: 'bed' });
Admission.belongsTo(User, { foreignKey: 'admittedBy', as: 'admittedByUser' });
Admission.belongsTo(User, { foreignKey: 'dischargedBy', as: 'dischargedByUser' });
Patient.hasMany(Admission, { foreignKey: 'patientId', as: 'admissions' });
Doctor.hasMany(Admission, { foreignKey: 'doctorId', as: 'admissions' });
Bed.hasMany(Admission, { foreignKey: 'bedId', as: 'admissions' });

module.exports = Admission;
