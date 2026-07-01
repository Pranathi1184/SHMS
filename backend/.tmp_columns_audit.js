require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const c = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  await c.connect();
  const cols = await c.query(`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name IN ('no_show_predictions','billing_risk_scores','doctor_load_forecasts','medicine_demand_forecasts','bed_occupancy_forecasts')
    ORDER BY table_name, ordinal_position
  `);

  const seq = await c.query(`
    SELECT sequence_name
    FROM information_schema.sequences
    WHERE sequence_schema='public'
      AND sequence_name LIKE '%no_show_predictions%'
  `);

  const fks = await c.query(`
    SELECT tc.table_name, tc.constraint_name, kcu.column_name, ccu.table_name AS ref_table, ccu.column_name AS ref_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.constraint_schema = kcu.constraint_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.constraint_schema = tc.constraint_schema
    WHERE tc.constraint_type='FOREIGN KEY'
      AND tc.table_schema='public'
      AND tc.table_name IN ('no_show_predictions','billing_risk_scores','doctor_load_forecasts','medicine_demand_forecasts')
    ORDER BY tc.table_name, tc.constraint_name
  `);

  console.log('COLUMNS', cols.rows);
  console.log('SEQUENCES', seq.rows);
  console.log('FKS', fks.rows);
  await c.end();
})().catch((e) => { console.error('AUDIT_ERROR:', e.message); process.exit(1); });
