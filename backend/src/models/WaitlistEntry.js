const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const Patient = require('./Patient');
const Doctor = require('./Doctor');

class WaitlistEntry extends Model {}

WaitlistEntry.init(
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
    preferredDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    preferredStartTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    preferredEndTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Matched', 'Cancelled'),
      allowNull: false,
      defaultValue: 'Active',
    },
    notifiedAt: {
      type: DataTypes.DATE,
    },
    notes: {
      type: DataTypes.TEXT,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'WaitlistEntry',
    tableName: 'waitlist_entries',
    indexes: [
      { fields: ['doctor_id', 'preferred_date'] },
      { fields: ['patient_id', 'status'] },
    ],
  }
);

WaitlistEntry.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
WaitlistEntry.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });
Patient.hasMany(WaitlistEntry, { foreignKey: 'patientId', as: 'waitlistEntries' });
Doctor.hasMany(WaitlistEntry, { foreignKey: 'doctorId', as: 'waitlistEntries' });

module.exports = WaitlistEntry;