const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Medicine extends Model {}

Medicine.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    genericName: {
      type: DataTypes.STRING(255),
    },
    dosageForm: {
      type: DataTypes.ENUM(
        'Tablet',
        'Capsule',
        'Syrup',
        'Injection',
        'Ointment',
        'Cream',
        'Drops',
        'Inhaler',
        'Other'
      ),
      allowNull: false,
    },
    strength: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    manufacturer: {
      type: DataTypes.STRING(255),
    },
    batchNumber: {
      type: DataTypes.STRING(100),
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    purchaseDate: {
      type: DataTypes.DATEONLY,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    reorderLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
    },
    description: {
      type: DataTypes.TEXT,
    },
  },
  {
    sequelize,
    modelName: 'Medicine',
    tableName: 'medicines',
    indexes: [
      { fields: ['name'] },
      { fields: ['generic_name'] },
      { fields: ['expiry_date'] },
      { fields: ['batch_number'] },
    ],
  }
);

module.exports = Medicine;
