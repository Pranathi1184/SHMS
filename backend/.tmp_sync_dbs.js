require('dotenv').config();
const { Sequelize } = require('sequelize');

async function syncDb(dbName) {
  const sequelize = new Sequelize(`postgresql://${encodeURIComponent(process.env.DB_USER)}:${encodeURIComponent(process.env.DB_PASSWORD)}@${process.env.DB_HOST}:${process.env.DB_PORT}/${dbName}`, {
    dialect: 'postgres',
    logging: false,
  });

  const db = require('./src/models');
  db.sequelize = sequelize;
  Object.keys(db).forEach((key) => {
    if (db[key] && db[key].sequelize) {
      db[key].sequelize = sequelize;
    }
  });

  await sequelize.sync();
  await sequelize.close();
}

(async () => {
  await syncDb('shms_mig_fresh');
  await syncDb('shms_mig_partial');
  console.log('SYNC_COMPLETE');
})().catch((e) => { console.error('SYNC_ERROR:', e.message); process.exit(1); });
