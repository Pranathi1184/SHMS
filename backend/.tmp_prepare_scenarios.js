require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const admin = new Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), database: 'postgres', user: process.env.DB_USER, password: process.env.DB_PASSWORD });
  await admin.connect();

  const dbs = ['shms_mig_fresh', 'shms_mig_partial'];
  for (const dbName of dbs) {
    await admin.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName}'`);
    await admin.query(`DROP DATABASE IF EXISTS ${dbName}`);
  }

  await admin.query('CREATE DATABASE shms_mig_fresh TEMPLATE shms');
  await admin.query('CREATE DATABASE shms_mig_partial TEMPLATE shms');
  await admin.end();

  const fresh = new Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), database: 'shms_mig_fresh', user: process.env.DB_USER, password: process.env.DB_PASSWORD });
  await fresh.connect();
  await fresh.query("DELETE FROM \"SequelizeMeta\" WHERE name = 'create-prediction-tables.js'");
  await fresh.query('DROP TABLE IF EXISTS billing_risk_scores CASCADE');
  await fresh.query('DROP TABLE IF EXISTS bed_occupancy_forecasts CASCADE');
  await fresh.query('DROP TABLE IF EXISTS medicine_demand_forecasts CASCADE');
  await fresh.query('DROP TABLE IF EXISTS doctor_load_forecasts CASCADE');
  await fresh.query('DROP TABLE IF EXISTS no_show_predictions CASCADE');
  await fresh.query('DROP TYPE IF EXISTS "enum_billing_risk_scores_risk_label"');
  await fresh.query('DROP TYPE IF EXISTS "enum_no_show_predictions_risk_label"');
  await fresh.end();

  const partial = new Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), database: 'shms_mig_partial', user: process.env.DB_USER, password: process.env.DB_PASSWORD });
  await partial.connect();
  await partial.query("DELETE FROM \"SequelizeMeta\" WHERE name = 'create-prediction-tables.js'");
  await partial.query('DROP TABLE IF EXISTS doctor_load_forecasts CASCADE');
  await partial.query('DROP TABLE IF EXISTS medicine_demand_forecasts CASCADE');
  await partial.query('DROP TABLE IF EXISTS bed_occupancy_forecasts CASCADE');
  await partial.end();

  console.log('SCENARIOS_READY');
})().catch((e) => { console.error('SCENARIO_SETUP_ERROR:', e.message); process.exit(1); });
