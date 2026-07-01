require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  await client.connect();
  const meta = await client.query('SELECT name FROM "SequelizeMeta" ORDER BY name');
  const tables = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema='public'
      AND table_name IN (
        'no_show_predictions',
        'doctor_load_forecasts',
        'medicine_demand_forecasts',
        'bed_occupancy_forecasts',
        'billing_risk_scores',
        'token_blacklist'
      )
    ORDER BY table_name
  `);

  const indexes = await client.query(`
    SELECT tablename, indexname
    FROM pg_indexes
    WHERE schemaname='public'
      AND tablename IN (
        'no_show_predictions',
        'doctor_load_forecasts',
        'medicine_demand_forecasts',
        'bed_occupancy_forecasts',
        'billing_risk_scores'
      )
    ORDER BY tablename, indexname
  `);

  const enums = await client.query(`
    SELECT t.typname AS enum_name, e.enumlabel AS enum_value
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname='public' AND t.typname LIKE 'enum_%'
    ORDER BY t.typname, e.enumsortorder
  `);

  console.log('META', meta.rows);
  console.log('TABLES', tables.rows);
  console.log('INDEXES', indexes.rows);
  console.log('ENUMS', enums.rows);

  await client.end();
})().catch((err) => {
  console.error('DB_AUDIT_ERROR:', err.message);
  process.exit(1);
});
