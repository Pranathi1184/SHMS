const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Department = require('./Department');

class Doctor extends Model {}

Doctor.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Department,
        key: 'id',
      },
    },
    specialization: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    licenseNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    consultationFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
  },
  {
    sequelize,
    modelName: 'Doctor',
    tableName: 'doctors',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['department_id'] },
      { unique: true, fields: ['license_number'] },
    ],
  }
);

Doctor.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Doctor.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
User.hasOne(Doctor, { foreignKey: 'userId', as: 'doctor' });
Department.hasMany(Doctor, { foreignKey: 'departmentId', as: 'doctors' });

module.exports = Doctor;
