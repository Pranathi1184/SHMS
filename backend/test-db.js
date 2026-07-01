require('dotenv').config();

const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

(async () => {
  try {
    await client.connect();
    console.log("✅ Connected successfully");
    const result = await client.query("SELECT current_user, current_database();");
    console.log(result.rows);
    await client.end();
  } catch (err) {
    console.error(err);
  }
})();