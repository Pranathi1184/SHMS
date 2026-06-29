const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const Bill = require('./Bill');

class BillItem extends Model {}

BillItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    billId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Bill,
        key: 'id',
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
  },
  {
    sequelize,
    modelName: 'BillItem',
    tableName: 'bill_items',
    indexes: [
      { fields: ['bill_id'] },
    ],
  }
);

BillItem.belongsTo(Bill, { foreignKey: 'billId', as: 'bill' });
Bill.hasMany(BillItem, { foreignKey: 'billId', as: 'items' });

module.exports = BillItem;
