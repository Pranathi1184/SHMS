const makeConfig = (dbNameFallback) => {
  const baseUrl = process.env.DATABASE_URL
    || `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${dbNameFallback}`;

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
