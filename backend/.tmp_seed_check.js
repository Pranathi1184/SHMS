require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const c = new Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });
  await c.connect();

  const tablesToCheck = [
    'users','departments','doctors','doctor_schedules','patients','appointments','ehr','medicines','prescriptions','prescription_items','laboratory_tests','insurance','bills','bill_items','wards','beds','admissions','notifications','claims','no_show_predictions','bed_occupancy_forecast','bed_occupancy_forecasts','doctor_load_forecast','doctor_load_forecasts','medicine_demand_forecast','medicine_demand_forecasts','billing_risk_scores'
  ];

  const existsRows = await c.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema='public' AND table_name = ANY($1::text[])
    ORDER BY table_name
  `, [tablesToCheck]);

  const existing = existsRows.rows.map(r => r.table_name);
  const counts = {};
  for (const t of existing) {
    const r = await c.query(`SELECT COUNT(*)::int AS count FROM "${t}"`);
    counts[t] = r.rows[0].count;
  }

  const meta = await c.query('SELECT name FROM "SequelizeMeta" ORDER BY name');

  console.log('EXISTING_TABLES', existing);
  console.log('COUNTS', counts);
  console.log('SEQUELIZE_META', meta.rows);

  await c.end();
})().catch((e) => { console.error('AUDIT_ERR', e.message); process.exit(1); });
