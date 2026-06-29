const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

class AuditLog extends Model {}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    actorUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    action: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    entityType: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    entityId: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    before: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    after: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    indexes: [
      { fields: ['entity_type', 'entity_id'] },
      { fields: ['actor_user_id'] },
      { fields: ['action'] },
    ],
  }
);

AuditLog.belongsTo(User, { foreignKey: 'actorUserId', as: 'actor' });
User.hasMany(AuditLog, { foreignKey: 'actorUserId', as: 'auditActions' });

module.exports = AuditLog;
