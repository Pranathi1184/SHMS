require('dotenv').config();
const { Client } = require('pg');
(async () => {
  const c = new Client({host:process.env.DB_HOST,port:Number(process.env.DB_PORT),database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD});
  await c.connect();
  const q = await c.query(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema='public'
      AND column_name='id'
      AND table_name IN ('appointments','bills','doctors','medicines')
    ORDER BY table_name
  `);
  console.log(q.rows);
  await c.end();
})().catch((e)=>{console.error(e.message);process.exit(1);});
