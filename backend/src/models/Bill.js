const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const Patient = require('./Patient');
const User = require('./User');

class Bill extends Model {}

Bill.init(
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
    billNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    billDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
    netAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    paymentMode: {
      type: DataTypes.ENUM('Cash', 'Card', 'UPI', 'Insurance', 'Net Banking', 'Other'),
    },
    paymentStatus: {
      type: DataTypes.ENUM('Pending', 'Partially Paid', 'Paid', 'Cancelled'),
      defaultValue: 'Pending',
    },
    insuranceId: {
      type: DataTypes.UUID,
      references: {
        model: require('./Insurance'),
        key: 'id',
      },
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
    modelName: 'Bill',
    tableName: 'bills',
    paranoid: true,
    indexes: [
      { fields: ['patient_id'] },
      { unique: true, fields: ['bill_number'] },
      { fields: ['payment_status'] },
      { fields: ['bill_date'] },
    ],
  }
);

Bill.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Bill.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Bill.belongsTo(require('./Insurance'), { foreignKey: 'insuranceId', as: 'insurance' });
Patient.hasMany(Bill, { foreignKey: 'patientId', as: 'bills' });

module.exports = Bill;
