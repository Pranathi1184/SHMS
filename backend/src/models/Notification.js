const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

class Notification extends Model {}

Notification.init(
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('Appointment', 'Test Result', 'Prescription', 'Bill', 'System', 'Other'),
      defaultValue: 'Other',
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    relatedId: {
      type: DataTypes.UUID,
    },
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['read'] },
      { fields: ['type'] },
    ],
  }
);

Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

module.exports = Notification;
