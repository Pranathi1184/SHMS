const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const Patient = require('./Patient');
const User = require('./User');

class CommunicationLog extends Model {}

CommunicationLog.init(
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
    sentBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    channel: {
      type: DataTypes.ENUM('SMS', 'Email', 'InApp'),
      allowNull: false,
      defaultValue: 'InApp',
    },
    category: {
      type: DataTypes.ENUM('Appointment Reminder', 'Bill Reminder', 'Lab Result', 'General'),
      defaultValue: 'General',
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Queued', 'Sent', 'Failed'),
      defaultValue: 'Queued',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'CommunicationLog',
    tableName: 'communication_logs',
    indexes: [{ fields: ['channel'] }, { fields: ['category'] }, { fields: ['patient_id'] }],
  }
);

CommunicationLog.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Patient.hasMany(CommunicationLog, { foreignKey: 'patientId', as: 'communications' });

CommunicationLog.belongsTo(User, { foreignKey: 'sentBy', as: 'sender' });
User.hasMany(CommunicationLog, { foreignKey: 'sentBy', as: 'sentCommunications' });

module.exports = CommunicationLog;
