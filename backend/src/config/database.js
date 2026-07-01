const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const logger = require('../utils/logger');
const { resolveDatabaseUrl } = require('../utils/databaseUrl');

dotenv.config();

const sequelize = new Sequelize(resolveDatabaseUrl(), {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
  dialectOptions: process.env.NODE_ENV === 'production'
    ? {
      ssl: {
        require: true,
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
      },
    }
    : {},
  define: {
    timestamps: true,
    paranoid: true,
    underscored: true,
  },
});

module.exports = sequelize;
