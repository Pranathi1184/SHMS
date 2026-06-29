const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const Doctor = require('./Doctor');

class DoctorSchedule extends Model {}

DoctorSchedule.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    doctorId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: Doctor,
        key: 'id',
      },
    },
    availableFrom: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '09:00:00',
    },
    availableTo: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '17:00:00',
    },
    slotDurationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
    },
    availableDays: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [1, 2, 3, 4, 5],
    },
    runningLate: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    lateDelayMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lateUpdatedAt: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    modelName: 'DoctorSchedule',
    tableName: 'doctor_schedules',
    indexes: [
      { unique: true, fields: ['doctor_id'] },
    ],
  }
);

DoctorSchedule.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });
Doctor.hasOne(DoctorSchedule, { foreignKey: 'doctorId', as: 'doctorSchedule' });

module.exports = DoctorSchedule;
