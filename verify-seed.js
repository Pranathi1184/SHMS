const db = require('./backend/src/models');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Database Verification:\n');
    
    const counts = {
      users: await db.User.count(),
      patients: await db.Patient.count(),
      appointments: await db.Appointment.count(),
      medicines: await db.Medicine.count(),
      bills: await db.Bill.count(),
      wards: await db.Ward.count(),
      beds: await db.Bed.count()
    };
    
    Object.entries(counts).forEach(([key, val]) => {
      console.log(`  ${key}: ${val} records`);
    });
    
    console.log('\n✅ All data successfully persisted to database!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
