require('dotenv').config();
const { Client } = require('pg');
const makeClient = (database) => new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

(async () => {
  const admin = makeClient('postgres');
  await admin.connect();
  for (const dbName of ['shms_mig_fresh', 'shms_mig_partial']) {
    await admin.query(`DROP DATABASE IF EXISTS ${dbName}`);
    await admin.query(`CREATE DATABASE ${dbName}`);
  }
  await admin.end();
  console.log('CREATED_DBS shms_mig_fresh, shms_mig_partial');
})().catch((e) => { console.error(e.message); process.exit(1); });
