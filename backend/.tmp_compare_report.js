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

  const tables = [
    'users','departments','doctors','doctor_schedules','patients','appointments','ehr','medicines','prescriptions','prescription_items','laboratory_tests','insurance','bills','bill_items','wards','beds','admissions','notifications','claims','no_show_predictions','bed_occupancy_forecast','doctor_load_forecast','medicine_demand_forecast','billing_risk_scores','bed_occupancy_forecasts','doctor_load_forecasts','medicine_demand_forecasts'
  ];

  const counts = {};
  for (const t of tables) {
    const e = await c.query(`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1)`, [t]);
    if (e.rows[0].exists) {
      const r = await c.query(`SELECT COUNT(*)::int AS c FROM "${t}"`);
      counts[t] = r.rows[0].c;
    } else {
      counts[t] = null;
    }
  }

  const roleCounts = await c.query(`SELECT role, COUNT(*)::int AS count FROM users GROUP BY role ORDER BY role`);
  const apptStatus = await c.query(`SELECT status, COUNT(*)::int AS count FROM appointments GROUP BY status ORDER BY status`);
  const billStatus = await c.query(`SELECT payment_status, COUNT(*)::int AS count FROM bills GROUP BY payment_status ORDER BY payment_status`);
  const claimStatus = await c.query(`SELECT status, COUNT(*)::int AS count FROM claims GROUP BY status ORDER BY status`);
  const labStatus = await c.query(`SELECT status, COUNT(*)::int AS count FROM laboratory_tests GROUP BY status ORDER BY status`);
  const admissionStatus = await c.query(`SELECT status, COUNT(*)::int AS count FROM admissions GROUP BY status ORDER BY status`);
  const noShowRisk = await c.query(`SELECT risk_label, COUNT(*)::int AS count FROM no_show_predictions GROUP BY risk_label ORDER BY risk_label`);
  const billRisk = await c.query(`SELECT risk_label, COUNT(*)::int AS count FROM billing_risk_scores GROUP BY risk_label ORDER BY risk_label`);

  const medStock = await c.query(`
    SELECT
      SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END)::int AS out_of_stock,
      SUM(CASE WHEN quantity > 0 AND quantity <= reorder_level THEN 1 ELSE 0 END)::int AS low_stock,
      SUM(CASE WHEN quantity > reorder_level THEN 1 ELSE 0 END)::int AS in_stock,
      COUNT(*)::int AS total
    FROM medicines
  `);

  const meta = await c.query('SELECT name FROM "SequelizeMeta" ORDER BY name');

  console.log('COUNTS', counts);
  console.log('ROLE_COUNTS', roleCounts.rows);
  console.log('APPOINTMENT_STATUS', apptStatus.rows);
  console.log('BILL_STATUS', billStatus.rows);
  console.log('CLAIM_STATUS', claimStatus.rows);
  console.log('LAB_STATUS', labStatus.rows);
  console.log('ADMISSION_STATUS', admissionStatus.rows);
  console.log('NO_SHOW_RISK', noShowRisk.rows);
  console.log('BILLING_RISK', billRisk.rows);
  console.log('MED_STOCK', medStock.rows[0]);
  console.log('SEQUELIZE_META', meta.rows);

  await c.end();
})().catch((e) => { console.error('COMPARE_ERR', e.message); process.exit(1); });
