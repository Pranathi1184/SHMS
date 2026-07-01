require('dotenv').config();
const { resolveDatabaseUrl } = require('../utils/databaseUrl');

const makeConfig = (dbNameFallback) => {
  const baseUrl = resolveDatabaseUrl({ dbName: dbNameFallback });

  return {
    use_env_variable: null,
    url: baseUrl,
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: true,
      paranoid: true,
      underscored: true,
    },
  };
};

module.exports = {
  development: makeConfig(process.env.DB_NAME || 'postgres'),
  test: makeConfig(process.env.TEST_DB_NAME || process.env.DB_NAME || 'postgres'),
  production: makeConfig(process.env.DB_NAME || 'postgres'),
};
