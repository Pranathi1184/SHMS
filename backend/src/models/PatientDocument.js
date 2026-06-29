const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const Patient = require('./Patient');
const User = require('./User');

class PatientDocument extends Model {}

PatientDocument.init(
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
    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    sizeBytes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    storageProvider: {
      type: DataTypes.ENUM('S3', 'Local'),
      allowNull: false,
      defaultValue: 'Local',
    },
    storageKey: {
      type: DataTypes.STRING(1024),
      allowNull: false,
    },
    bucketName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fileUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('Report', 'Prescription', 'Insurance', 'ID', 'Other'),
      allowNull: false,
      defaultValue: 'Other',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'PatientDocument',
    tableName: 'patient_documents',
    indexes: [
      { fields: ['patient_id'] },
      { fields: ['uploaded_by'] },
      { fields: ['category'] },
      { fields: ['created_at'] },
    ],
  }
);

PatientDocument.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Patient.hasMany(PatientDocument, { foreignKey: 'patientId', as: 'documents' });

PatientDocument.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });
User.hasMany(PatientDocument, { foreignKey: 'uploadedBy', as: 'uploadedPatientDocuments' });

module.exports = PatientDocument;
