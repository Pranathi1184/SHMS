const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const Insurance = require('./Insurance');
const Patient = require('./Patient');
const Bill = require('./Bill');

class Claim extends Model {}

Claim.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    insuranceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Insurance,
        key: 'id',
      },
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Patient,
        key: 'id',
      },
    },
    billId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: Bill,
        key: 'id',
      },
    },
    claimNumber: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
    },
    claimAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    approvedAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: null,
    },
    status: {
      type: DataTypes.ENUM('Submitted', 'Under Verification', 'Approved', 'Rejected', 'Paid'),
      defaultValue: 'Submitted',
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    payoutDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Claim',
    tableName: 'claims',
    indexes: [
      { fields: ['status'] },
      { fields: ['patient_id'] },
      { fields: ['insurance_id'] },
    ],
  }
);

Claim.belongsTo(Insurance, { foreignKey: 'insuranceId', as: 'insurance' });
Insurance.hasMany(Claim, { foreignKey: 'insuranceId', as: 'claims' });

Claim.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Patient.hasMany(Claim, { foreignKey: 'patientId', as: 'claims' });

Claim.belongsTo(Bill, { foreignKey: 'billId', as: 'bill' });
Bill.hasMany(Claim, { foreignKey: 'billId', as: 'claims' });

module.exports = Claim;
