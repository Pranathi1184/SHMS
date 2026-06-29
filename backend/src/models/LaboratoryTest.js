const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const Patient = require('./Patient');
const Doctor = require('./Doctor');
const User = require('./User');

class LaboratoryTest extends Model {}

LaboratoryTest.init(
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
    testName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    testCode: {
      type: DataTypes.STRING(100),
    },
    orderDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    sampleCollectedDate: {
      type: DataTypes.DATE,
    },
    resultDate: {
      type: DataTypes.DATE,
    },
    results: {
      type: DataTypes.JSONB,
    },
    status: {
      type: DataTypes.ENUM('Ordered', 'Sample Collected', 'In Progress', 'Completed', 'Cancelled'),
      defaultValue: 'Ordered',
    },
    notes: {
      type: DataTypes.TEXT,
    },
    orderedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    performedBy: {
      type: DataTypes.UUID,
      references: {
        model: User,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'LaboratoryTest',
    tableName: 'laboratory_tests',
    indexes: [
      { fields: ['patient_id'] },
      { fields: ['doctor_id'] },
      { fields: ['status'] },
      { fields: ['order_date'] },
    ],
  }
);

LaboratoryTest.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
LaboratoryTest.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });
LaboratoryTest.belongsTo(User, { foreignKey: 'orderedBy', as: 'orderedByUser' });
LaboratoryTest.belongsTo(User, { foreignKey: 'performedBy', as: 'performedByUser' });
Patient.hasMany(LaboratoryTest, { foreignKey: 'patientId', as: 'laboratoryTests' });
Doctor.hasMany(LaboratoryTest, { foreignKey: 'doctorId', as: 'laboratoryTests' });

module.exports = LaboratoryTest;
