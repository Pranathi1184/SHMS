const encode = (value) => encodeURIComponent(String(value ?? ''));

const buildPostgresUrlFromEnv = ({ dbName } = {}) => {
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres';
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const database = dbName || process.env.DB_NAME || 'postgres';

  return `postgresql://${encode(user)}:${encode(password)}@${host}:${port}/${encode(database)}`;
};

const resolveDatabaseUrl = ({ dbName } = {}) => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  return buildPostgresUrlFromEnv({ dbName });
};

module.exports = {
  buildPostgresUrlFromEnv,
  resolveDatabaseUrl,
};
