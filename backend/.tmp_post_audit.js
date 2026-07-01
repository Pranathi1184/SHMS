require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const c = new Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });
  await c.connect();

  const meta = await c.query('SELECT name FROM "SequelizeMeta" ORDER BY name');
  const tables = await c.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema='public' AND table_name IN (
      'no_show_predictions','doctor_load_forecasts','medicine_demand_forecasts','bed_occupancy_forecasts','billing_risk_scores','token_blacklist'
    )
    ORDER BY table_name
  `);

  const indexes = await c.query(`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname='public' AND tablename IN (
      'no_show_predictions','doctor_load_forecasts','medicine_demand_forecasts','bed_occupancy_forecasts','billing_risk_scores'
    )
    ORDER BY tablename, indexname
  `);

  const duplicateIndexes = await c.query(`
    SELECT indexname, COUNT(*)
    FROM pg_indexes
    WHERE schemaname='public'
    GROUP BY indexname
    HAVING COUNT(*) > 1
    ORDER BY indexname
  `);

  const fks = await c.query(`
    SELECT tc.table_name, tc.constraint_name, kcu.column_name, ccu.table_name AS ref_table
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.constraint_schema = kcu.constraint_schema
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name AND ccu.constraint_schema = tc.constraint_schema
    WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public'
      AND tc.table_name IN ('no_show_predictions','doctor_load_forecasts','medicine_demand_forecasts','billing_risk_scores')
    ORDER BY tc.table_name, tc.constraint_name
  `);

  const duplicateConstraints = await c.query(`
    SELECT constraint_name, COUNT(*)
    FROM information_schema.table_constraints
    WHERE constraint_schema='public'
    GROUP BY constraint_name
    HAVING COUNT(*) > 1
    ORDER BY constraint_name
  `);

  const enums = await c.query(`
    SELECT t.typname AS enum_name, array_agg(e.enumlabel ORDER BY e.enumsortorder) AS values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname='public' AND t.typname IN ('enum_no_show_predictions_risk_label','enum_billing_risk_scores_risk_label')
    GROUP BY t.typname
    ORDER BY t.typname
  `);

  console.log('META', meta.rows);
  console.log('TABLES', tables.rows);
  console.log('INDEXES', indexes.rows.map((r) => ({ tablename: r.tablename, indexname: r.indexname })));
  console.log('DUPLICATE_INDEXES', duplicateIndexes.rows);
  console.log('FKS', fks.rows);
  console.log('DUPLICATE_CONSTRAINTS', duplicateConstraints.rows.slice(0, 20));
  console.log('ENUMS', enums.rows);

  await c.end();
})().catch((e) => { console.error('POST_MIGRATION_AUDIT_ERROR:', e.message); process.exit(1); });
