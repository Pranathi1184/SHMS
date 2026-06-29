const db = require('./src/models');

const seed = require('./src/seeders/20260626120000-seed-all');

(async () => {
  try {
    console.log('Syncing PostgreSQL schema with force: true...');
    await db.sequelize.sync({ force: true });
    console.log('Running seed...');
    await seed.up(db.sequelize.getQueryInterface(), db.Sequelize);
    console.log('Seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
})();
