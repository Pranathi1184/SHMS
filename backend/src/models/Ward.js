const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const Department = require('./Department');

class Ward extends Model {}

Ward.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Department,
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM('General', 'Private', 'Semi-Private', 'ICU', 'Emergency'),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
  },
  {
    sequelize,
    modelName: 'Ward',
    tableName: 'wards',
    indexes: [
      { fields: ['department_id'] },
      { fields: ['type'] },
    ],
  }
);

Ward.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
Department.hasMany(Ward, { foreignKey: 'departmentId', as: 'wards' });

module.exports = Ward;
