const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class TokenBlacklist extends Model {}

TokenBlacklist.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tokenHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'TokenBlacklist',
    tableName: 'token_blacklist',
    indexes: [
      { fields: ['token_hash'] },
      { fields: ['user_id'] },
      { fields: ['expires_at'] },
    ],
  }
);

module.exports = TokenBlacklist;
