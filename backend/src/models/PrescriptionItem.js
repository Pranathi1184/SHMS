const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const Prescription = require('./Prescription');
const Medicine = require('./Medicine');

class PrescriptionItem extends Model {}

PrescriptionItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    prescriptionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Prescription,
        key: 'id',
      },
    },
    medicineId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Medicine,
        key: 'id',
      },
    },
    dosage: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    frequency: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    duration: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    instructions: {
      type: DataTypes.TEXT,
    },
  },
  {
    sequelize,
    modelName: 'PrescriptionItem',
    tableName: 'prescription_items',
    paranoid: true,
    indexes: [
      { fields: ['prescription_id'] },
      { fields: ['medicine_id'] },
    ],
  }
);

PrescriptionItem.belongsTo(Prescription, { foreignKey: 'prescriptionId', as: 'prescription' });
PrescriptionItem.belongsTo(Medicine, { foreignKey: 'medicineId', as: 'medicine' });
Prescription.hasMany(PrescriptionItem, { foreignKey: 'prescriptionId', as: 'items' });

module.exports = PrescriptionItem;
