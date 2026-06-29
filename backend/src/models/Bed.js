const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const Ward = require('./Ward');

class Bed extends Model {}

Bed.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    wardId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Ward,
        key: 'id',
      },
    },
    bedNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Available', 'Occupied', 'Maintenance', 'Cleaning'),
      defaultValue: 'Available',
    },
    pricePerDay: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
  },
  {
    sequelize,
    modelName: 'Bed',
    tableName: 'beds',
    indexes: [
      { fields: ['ward_id'] },
      { fields: ['status'] },
      { unique: true, fields: ['ward_id', 'bed_number'] },
    ],
  }
);

Bed.belongsTo(Ward, { foreignKey: 'wardId', as: 'ward' });
Ward.hasMany(Bed, { foreignKey: 'wardId', as: 'beds' });

module.exports = Bed;
