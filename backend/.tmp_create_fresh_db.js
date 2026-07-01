require('dotenv').config();
const { Client } = require('pg');
(async () => {
  const admin = new Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), database: 'postgres', user: process.env.DB_USER, password: process.env.DB_PASSWORD });
  await admin.connect();
  const dbName = 'shms_mig_fresh';
  await admin.query(`DROP DATABASE IF EXISTS ${dbName}`);
  await admin.query(`CREATE DATABASE ${dbName}`);
  await admin.end();
  console.log('CREATED_DB', dbName);
})().catch((e) => { console.error(e.message); process.exit(1); });
