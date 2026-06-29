require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'postgres',
  });

  await client.connect();

  const dbName = process.env.DB_NAME || 'shms';
  const check = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);

  if (check.rowCount === 0) {
    const safeDbName = dbName.replace(/"/g, '');
    await client.query(`CREATE DATABASE "${safeDbName}"`);
    console.log(`Created database: ${dbName}`);
  } else {
    console.log(`Database already exists: ${dbName}`);
  }

  await client.end();
})().catch((error) => {
  console.error('Failed to ensure database:', error.message);
  process.exit(1);
});
