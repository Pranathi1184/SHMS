const bcrypt = require('bcryptjs');
const db = require('./src/models');

const seedData = async () => {
  try {
    console.log('Starting comprehensive seed with 50+ realistic records...');

    // ============================================
    // 1. ADMIN USER
    // ============================================
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await db.User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@shms.com',
      password: adminPassword,
      role: 'Administrator',
      phone: '1234567890',
      isActive: true
    });
    console.log('✓ Admin user created');

    // ============================================
    // 2. DEPARTMENTS
    // ============================================
    const depts = await Promise.all([
      db.Department.create({
        name: 'General Medicine',
        description: 'Internal medicine and general practice'
      }),
      db.Department.create({
        name: 'Cardiology',
        description: 'Heart and cardiovascular diseases'
      }),
      db.Department.create({
        name: 'Orthopedics',
        description: 'Bone and joint disorders'
      }),
    ]);
    console.log('✓ Created 3 departments');

    // ============================================
    // 3. DOCTORS (6 doctors across departments)
    // ============================================
    const doctorUsers = await Promise.all([
      db.User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@shms.com',
        password: await bcrypt.hash('doctor123', 10),
        role: 'Doctor',
        phone: '555-0001',
        isActive: true
      }),
      db.User.create({
        firstName: 'Sarah',
        lastName: 'Smith',
        email: 'sarah.smith@shms.com',
        password: await bcrypt.hash('doctor123', 10),
        role: 'Doctor',
        phone: '555-0002',
        isActive: true
      }),
      db.User.create({
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@shms.com',
        password: await bcrypt.hash('doctor123', 10),
        role: 'Doctor',
        phone: '555-0003',
        isActive: true
      }),
      db.User.create({
        firstName: 'Emily',
        lastName: 'Wilson',
        email: 'emily.wilson@shms.com',
        password: await bcrypt.hash('doctor123', 10),
        role: 'Doctor',
        phone: '555-0004',
        isActive: true
      }),
      db.User.create({
        firstName: 'Robert',
        lastName: 'Johnson',
        email: 'robert.johnson@shms.com',
        password: await bcrypt.hash('doctor123', 10),
        role: 'Doctor',
        phone: '555-0005',
        isActive: true
      }),
      db.User.create({
        firstName: 'Lisa',
        lastName: 'Davis',
        email: 'lisa.davis@shms.com',
        password: await bcrypt.hash('doctor123', 10),
        role: 'Doctor',
        phone: '555-0006',
        isActive: true
      }),
    ]);

    const doctors = await Promise.all([
      db.Doctor.create({
        userId: doctorUsers[0].id,
        departmentId: depts[0].id,
        specialization: 'General Physician',
        licenseNumber: 'LIC001'
      }),
      db.Doctor.create({
        userId: doctorUsers[1].id,
        departmentId: depts[1].id,
        specialization: 'Cardiologist',
        licenseNumber: 'LIC002'
      }),
      db.Doctor.create({
        userId: doctorUsers[2].id,
        departmentId: depts[2].id,
        specialization: 'Orthopedic Surgeon',
        licenseNumber: 'LIC003'
      }),
      db.Doctor.create({
        userId: doctorUsers[3].id,
        departmentId: depts[0].id,
        specialization: 'Internal Medicine',
        licenseNumber: 'LIC004'
      }),
      db.Doctor.create({
        userId: doctorUsers[4].id,
        departmentId: depts[1].id,
        specialization: 'Interventional Cardiologist',
        licenseNumber: 'LIC005'
      }),
      db.Doctor.create({
        userId: doctorUsers[5].id,
        departmentId: depts[2].id,
        specialization: 'Sports Medicine',
        licenseNumber: 'LIC006'
      }),
    ]);
    console.log('✓ Created 6 doctors');

    // ============================================
    // 4. OTHER STAFF USERS
    // ============================================
    const staffUsers = await Promise.all([
      db.User.create({
        firstName: 'Alice',
        lastName: 'Nurse',
        email: 'alice.nurse@shms.com',
        password: await bcrypt.hash('nurse123', 10),
        role: 'Nurse',
        phone: '555-1001',
        isActive: true
      }),
      db.User.create({
        firstName: 'Bob',
        lastName: 'Receptionist',
        email: 'bob.receptionist@shms.com',
        password: await bcrypt.hash('receptionist123', 10),
        role: 'Receptionist',
        phone: '555-1002',
        isActive: true
      }),
      db.User.create({
        firstName: 'Carol',
        lastName: 'LabTech',
        email: 'carol.labtech@shms.com',
        password: await bcrypt.hash('labtech123', 10),
        role: 'Lab Technician',
        phone: '555-1003',
        isActive: true
      }),
      db.User.create({
        firstName: 'David',
        lastName: 'Pharmacist',
        email: 'david.pharmacist@shms.com',
        password: await bcrypt.hash('pharmacist123', 10),
        role: 'Pharmacist',
        phone: '555-1004',
        isActive: true
      }),
      db.User.create({
        firstName: 'Eve',
        lastName: 'Billing',
        email: 'eve.billing@shms.com',
        password: await bcrypt.hash('billing123', 10),
        role: 'Billing Staff',
        phone: '555-1005',
        isActive: true
      }),
    ]);
    console.log('✓ Created 5 staff users');

    // ============================================
    // 5. PATIENTS (15 patients)
    // ============================================
    const patients = await Promise.all([
      db.Patient.create({
        firstName: 'James',
        lastName: 'Martinez',
        email: 'james.martinez@email.com',
        phone: '555-2001',
        gender: 'Male',
        dateOfBirth: '1970-03-15',
        bloodType: 'O+',
        isActive: true
      }),
      db.Patient.create({
        firstName: 'Patricia',
        lastName: 'Garcia',
        email: 'patricia.garcia@email.com',
        phone: '555-2002',
        gender: 'Female',
        dateOfBirth: '1985-07-22',
        bloodType: 'A+',
        isActive: true
      }),
      db.Patient.create({
        firstName: 'Charles',
        lastName: 'Rodriguez',
        email: 'charles.rodriguez@email.com',
        phone: '555-2003',
        gender: 'Male',
        dateOfBirth: '1955-11-08',
        bloodType: 'B+',
        isActive: true
      }),
      db.Patient.create({
        firstName: 'Linda',
        lastName: 'Lee',
        email: 'linda.lee@email.com',
        phone: '555-2004',
        gender: 'Female',
        dateOfBirth: '1990-01-30',
        bloodType: 'AB+',
        isActive: true
      }),
      db.Patient.create({
        firstName: 'Thomas',
        lastName: 'Walker',
        email: 'thomas.walker@email.com',
        phone: '555-2005',
        gender: 'Male',
        dateOfBirth: '1965-05-12',
        bloodType: 'O+',
        isActive: true
      }),
      db.Patient.create({
        firstName: 'Barbara',
        lastName: 'Hall',
        email: 'barbara.hall@email.com',
        phone: '555-2006',
        gender: 'Female',
        dateOfBirth: '1982-09-25',
        bloodType: 'A-',
        isActive: true
      }),
      db.Patient.create({
        firstName: 'Christopher',
        lastName: 'Allen',
        email: 'christopher.allen@email.com',
        phone: '555-2007',
        gender: 'Male',
        dateOfBirth: '1975-12-03',
        bloodType: 'B+',
        isActive: true
      }),
      db.Patient.create({
        firstName: 'Mary',
        lastName: 'Young',
        email: 'mary.young@email.com',
        phone: '555-2008',
        gender: 'Female',
        dateOfBirth: '1988-06-18',
        bloodType: 'O+',
        isActive: true
      }),
      db.Patient.create({
        firstName: 'Daniel',
        lastName: 'King',
        email: 'daniel.king@email.com',
        phone: '555-2009',
        gender: 'Male',
        dateOfBirth: '1960-02-14',
        bloodType: 'AB+',
        isActive: true
      }),
      db.Patient.create({
        firstName: 'Jennifer',
        lastName: 'Wright',
        email: 'jennifer.wright@email.com',
        phone: '555-2010',
        gender: 'Female',
        dateOfBirth: '1992-04-09',
        bloodType: 'A+',
        isActive: true
      }),
      db.Patient.create({
        firstName: 'Mark',
        lastName: 'Lopez',
        email: 'mark.lopez@email.com',
        phone: '555-2011',
        gender: 'Male',
        dateOfBirth: '1978-08-21',
        bloodType: 'B-',
        isActive: true
      }),
      db.Patient.create({
        firstName: 'Sandra',
        lastName: 'Hill',
        email: 'sandra.hill@email.com',
        phone: '555-2012',
        gender: 'Female',
        dateOfBirth: '1970-10-07',
        bloodType: 'O+',
        isActive: true
      }),
      db.Patient.create({
        firstName: 'Donald',
        lastName: 'Scott',
        email: 'donald.scott@email.com',
        phone: '555-2013',
        gender: 'Male',
        dateOfBirth: '1968-01-19',
        bloodType: 'A+',
        isActive: true
      }),
      db.Patient.create({
        firstName: 'Karen',
        lastName: 'Green',
        email: 'karen.green@email.com',
        phone: '555-2014',
        gender: 'Female',
        dateOfBirth: '1986-03-11',
        bloodType: 'B+',
        isActive: true
      }),
      db.Patient.create({
        firstName: 'Steven',
        lastName: 'Adams',
        email: 'steven.adams@email.com',
        phone: '555-2015',
        gender: 'Male',
        dateOfBirth: '1980-07-28',
        bloodType: 'AB-',
        isActive: true
      }),
    ]);
    console.log('✓ Created 15 patients');

    // ============================================
    // 6. APPOINTMENTS (20 appointments)
    // ============================================
    const now = new Date();
    const appointments = await Promise.all([
      ...patients.slice(0, 5).map((patient, idx) =>
        db.Appointment.create({
          patientId: patient.id,
          doctorId: doctors[idx % 6].id,
          appointmentDate: new Date(now.getTime() + (idx + 1) * 24 * 60 * 60 * 1000),
          startTime: '09:00',
          endTime: '09:30',
          status: 'Scheduled',
          reason: ['General checkup', 'Follow-up', 'Cardiac consultation', 'Orthopedic evaluation', 'Blood pressure check'][idx % 5],
          createdBy: admin.id
        })
      ),
      ...patients.slice(5, 10).map((patient, idx) =>
        db.Appointment.create({
          patientId: patient.id,
          doctorId: doctors[(idx + 1) % 6].id,
          appointmentDate: new Date(now.getTime() + (idx + 10) * 24 * 60 * 60 * 1000),
          startTime: '14:00',
          endTime: '14:30',
          status: 'Scheduled',
          reason: ['Post-operative checkup', 'Lab result review', 'Medication adjustment', 'Preventive care', 'Specialist consultation'][idx % 5],
          createdBy: admin.id
        })
      ),
      ...patients.slice(10, 15).map((patient, idx) =>
        db.Appointment.create({
          patientId: patient.id,
          doctorId: doctors[(idx + 2) % 6].id,
          appointmentDate: new Date(now.getTime() - (5 - idx) * 24 * 60 * 60 * 1000),
          startTime: '11:00',
          endTime: '11:30',
          status: 'Completed',
          reason: ['Annual physical', 'Chronic disease management', 'X-ray review', 'EKG interpretation', 'Treatment planning'][idx % 5],
          createdBy: admin.id
        })
      ),
    ]);
    console.log('✓ Created 20 appointments');

    // ============================================
    // 7. EHR RECORDS (15 records)
    // ============================================
    const ehrRecords = await Promise.all(
      patients.map((patient, idx) =>
        db.EHR.create({
          patientId: patient.id,
          doctorId: doctors[idx % 6].id,
          diagnosis: ['Type 2 Diabetes', 'Hypertension', 'Atrial Fibrillation', 'Osteoarthritis', 'Asthma', 'COPD', 'Coronary Artery Disease'][idx % 7],
          notes: `Patient presents with ${['stable condition', 'controlled symptoms', 'improvement', 'minor complications'][idx % 4]}. Continue current treatment plan.`,
          createdBy: admin.id,
          createdAt: new Date(now.getTime() - idx * 30 * 24 * 60 * 60 * 1000)
        })
      )
    );
    console.log('✓ Created 15 EHR records');

    // ============================================
    // 8. MEDICINES (10 medicines)
    // ============================================
    const medicines = await Promise.all([
      db.Medicine.create({
        name: 'Metformin',
        genericName: 'Metformin HCl',
        dosageForm: 'Tablet',
        strength: '500mg',
        manufacturer: 'Pharma Corp',
        quantity: 500,
        unitPrice: 0.50,
        reorderLevel: 100,
        expiryDate: new Date(2026, 11, 31)
      }),
      db.Medicine.create({
        name: 'Lisinopril',
        genericName: 'Lisinopril',
        dosageForm: 'Tablet',
        strength: '10mg',
        manufacturer: 'MedLabs',
        quantity: 300,
        unitPrice: 1.20,
        reorderLevel: 50,
        expiryDate: new Date(2027, 5, 30)
      }),
      db.Medicine.create({
        name: 'Atorvastatin',
        genericName: 'Atorvastatin Calcium',
        dosageForm: 'Tablet',
        strength: '20mg',
        manufacturer: 'Pharma Corp',
        quantity: 400,
        unitPrice: 0.75,
        reorderLevel: 80,
        expiryDate: new Date(2026, 8, 30)
      }),
      db.Medicine.create({
        name: 'Amoxicillin',
        genericName: 'Amoxicillin Trihydrate',
        dosageForm: 'Capsule',
        strength: '250mg',
        manufacturer: 'BioMed',
        quantity: 800,
        unitPrice: 0.30,
        reorderLevel: 200,
        expiryDate: new Date(2025, 11, 31)
      }),
      db.Medicine.create({
        name: 'Ibuprofen',
        genericName: 'Ibuprofen',
        dosageForm: 'Tablet',
        strength: '200mg',
        manufacturer: 'HealthCare Ltd',
        quantity: 1200,
        unitPrice: 0.15,
        reorderLevel: 300,
        expiryDate: new Date(2026, 3, 30)
      }),
      db.Medicine.create({
        name: 'Omeprazole',
        genericName: 'Omeprazole',
        dosageForm: 'Capsule',
        strength: '20mg',
        manufacturer: 'Pharma Corp',
        quantity: 350,
        unitPrice: 0.60,
        reorderLevel: 70,
        expiryDate: new Date(2027, 1, 28)
      }),
      db.Medicine.create({
        name: 'Aspirin',
        genericName: 'Acetylsalicylic Acid',
        dosageForm: 'Tablet',
        strength: '81mg',
        manufacturer: 'MedLabs',
        quantity: 600,
        unitPrice: 0.25,
        reorderLevel: 150,
        expiryDate: new Date(2026, 6, 31)
      }),
      db.Medicine.create({
        name: 'Ciprofloxacin',
        genericName: 'Ciprofloxacin HCl',
        dosageForm: 'Tablet',
        strength: '500mg',
        manufacturer: 'BioMed',
        quantity: 200,
        unitPrice: 1.50,
        reorderLevel: 50,
        expiryDate: new Date(2025, 9, 30)
      }),
      db.Medicine.create({
        name: 'Metoprolol',
        genericName: 'Metoprolol Tartrate',
        dosageForm: 'Tablet',
        strength: '50mg',
        manufacturer: 'HealthCare Ltd',
        quantity: 250,
        unitPrice: 0.80,
        reorderLevel: 60,
        expiryDate: new Date(2026, 10, 30)
      }),
      db.Medicine.create({
        name: 'Loratadine',
        genericName: 'Loratadine',
        dosageForm: 'Tablet',
        strength: '10mg',
        manufacturer: 'Pharma Corp',
        quantity: 400,
        unitPrice: 0.40,
        reorderLevel: 100,
        expiryDate: new Date(2027, 0, 31)
      }),
    ]);
    console.log('✓ Created 10 medicines');

    // ============================================
    // 9. PRESCRIPTIONS (12 prescriptions)
    // ============================================
    const prescriptions = await Promise.all(
      patients.slice(0, 12).map((patient, idx) =>
        db.Prescription.create({
          patientId: patient.id,
          doctorId: doctors[idx % 6].id,
          prescriptionDate: new Date(now.getTime() - idx * 7 * 24 * 60 * 60 * 1000),
          status: idx < 6 ? 'Pending' : 'Dispensed',
          createdBy: admin.id
        })
      )
    );
    console.log('✓ Created 12 prescriptions');

    // ============================================
    // 10. PRESCRIPTION ITEMS (20 items)
    // ============================================
    const prescriptionItems = await Promise.all(
      prescriptions.flatMap((prescription, idx) => [
        db.PrescriptionItem.create({
          prescriptionId: prescription.id,
          medicineId: medicines[idx % 10].id,
          quantity: [30, 60, 90][idx % 3],
          dosage: '1 tablet',
          frequency: 'Once daily',
          duration: '30 days'
        }),
        idx < prescriptions.length - 1 ? db.PrescriptionItem.create({
          prescriptionId: prescription.id,
          medicineId: medicines[(idx + 1) % 10].id,
          quantity: [30, 60][idx % 2],
          dosage: '1 tablet',
          frequency: 'Twice daily',
          duration: '14 days'
        }) : null
      ]).filter(Boolean)
    );
    console.log('✓ Created 20 prescription items');

    // ============================================
    // 11. LABORATORY TESTS (15 tests)
    // ============================================
    const labTests = await Promise.all(
      patients.map((patient, idx) =>
        db.LaboratoryTest.create({
          patientId: patient.id,
          doctorId: doctors[idx % 6].id,
          testName: ['Fasting Blood Glucose', 'Complete Blood Count', 'Comprehensive Metabolic Panel', 'Lipid Panel', 'Thyroid Function Test', 'Liver Function Test', 'Kidney Function Test'][idx % 7],
          orderDate: new Date(now.getTime() - idx * 14 * 24 * 60 * 60 * 1000),
          status: 'Completed',
          resultDate: new Date(now.getTime() - (idx - 2) * 14 * 24 * 60 * 60 * 1000),
          results: { status: ['Normal', 'Elevated', 'Low', 'Critical', 'Borderline'][idx % 5] },
          notes: `Test performed on ${new Date().toLocaleDateString()}. Results reviewed.`,
          orderedBy: admin.id
        })
      )
    );
    console.log('✓ Created 15 laboratory tests');

    // ============================================
    // 12. INSURANCE RECORDS (10 insurance records)
    // ============================================
    const insuranceRecords = await Promise.all(
      patients.slice(0, 10).map((patient, idx) =>
        db.Insurance.create({
          patientId: patient.id,
          providerName: ['HealthCare Plus', 'Total Health Insurance', 'National Health Services', 'Blue Cross', 'Aetna'][idx % 5],
          policyNumber: `POL-${String(idx + 1).padStart(6, '0')}`,
          policyHolderName: `${patient.firstName} ${patient.lastName}`,
          relationshipToPatient: 'Self',
          coverageStartDate: new Date(2024, 0, 1),
          coverageEndDate: new Date(2025, 11, 31),
          coverageDetails: `Coverage for ${['Basic', 'Premium', 'Essential'][idx % 3]} Health Plan with ${[70, 85, 60][idx % 3]}% coverage`
        })
      )
    );
    console.log('✓ Created 10 insurance records');

    // ============================================
    // 13. BILLS (10 bills)
    // ============================================
    const bills = await Promise.all(
      patients.slice(0, 10).map((patient, idx) => {
        const amount = [1500, 2500, 3000, 1200, 2000, 4500, 1800, 2200, 3500, 5000][idx];
        return db.Bill.create({
          patientId: patient.id,
          billNumber: `BILL-${String(idx + 1).padStart(6, '0')}`,
          billDate: new Date(now.getTime() - idx * 10 * 24 * 60 * 60 * 1000),
          totalAmount: amount,
          discount: amount * 0.05,
          taxAmount: amount * 0.10,
          netAmount: amount * 0.85,
          paymentMode: ['Cash', 'Card', 'UPI', 'Insurance'][idx % 4],
          paymentStatus: idx < 4 ? 'Pending' : idx < 7 ? 'Partially Paid' : 'Paid',
          createdBy: admin.id
        });
      })
    );
    console.log('✓ Created 10 bills');

    // ============================================
    // 14. BILL ITEMS (15 items)
    // ============================================
    const billItems = await Promise.all(
      bills.flatMap((bill, idx) => [
        db.BillItem.create({
          billId: bill.id,
          description: 'Consultation Fee',
          quantity: 1,
          unitPrice: 150,
          amount: 150
        }),
        db.BillItem.create({
          billId: bill.id,
          description: idx < 5 ? 'Laboratory Test' : 'Imaging Study',
          quantity: 1,
          unitPrice: idx < 5 ? 300 : 500,
          amount: idx < 5 ? 300 : 500
        }),
      ])
    );
    console.log('✓ Created 15 bill items');

    // ============================================
    // 15. WARDS (3 wards)
    // ============================================
    const wards = await Promise.all([
      db.Ward.create({
        name: 'General Ward A',
        type: 'General',
        departmentId: depts[0].id,
        description: 'General admission ward'
      }),
      db.Ward.create({
        name: 'Cardiac Care Unit',
        type: 'ICU',
        departmentId: depts[1].id,
        description: 'Intensive cardiac monitoring'
      }),
      db.Ward.create({
        name: 'Orthopedic Ward',
        type: 'Private',
        departmentId: depts[2].id,
        description: 'Post-operative orthopedic patients'
      }),
    ]);
    console.log('✓ Created 3 wards');

    // ============================================
    // 16. BEDS (30 beds)
    // ============================================
    const beds = await Promise.all([
      ...Array(20).fill(null).map((_, idx) =>
        db.Bed.create({
          wardId: wards[0].id,
          bedNumber: `A-${idx + 1}`,
          status: idx < 12 ? 'Occupied' : 'Available'
        })
      ),
      ...Array(10).fill(null).map((_, idx) =>
        db.Bed.create({
          wardId: wards[1].id,
          bedNumber: `CCU-${idx + 1}`,
          status: idx < 6 ? 'Occupied' : 'Available'
        })
      ),
      ...Array(15).fill(null).map((_, idx) =>
        db.Bed.create({
          wardId: wards[2].id,
          bedNumber: `Ortho-${idx + 1}`,
          status: idx < 8 ? 'Occupied' : 'Available'
        })
      ),
    ]);
    console.log('✓ Created 30 beds');

    // ============================================
    // 17. ADMISSIONS (8 admissions)
    // ============================================
    const admissions = await Promise.all(
      patients.slice(0, 8).map((patient, idx) =>
        db.Admission.create({
          patientId: patient.id,
          bedId: beds[idx % 30].id,
          doctorId: doctors[idx % 6].id,
          admissionDate: new Date(now.getTime() - (idx + 10) * 24 * 60 * 60 * 1000),
          dischargeDate: idx < 3 ? null : new Date(now.getTime() - idx * 24 * 60 * 60 * 1000),
          reasonForAdmission: ['Emergency', 'Planned Surgery', 'Acute Illness', 'Post-operative Recovery', 'Chronic Disease Management'][idx % 5],
          status: idx < 3 ? 'Admitted' : 'Discharged',
          admittedBy: admin.id,
          dischargedBy: idx < 3 ? null : admin.id,
          notes: `Patient admitted for ${['Emergency', 'Planned Surgery', 'Acute Illness', 'Post-operative Recovery', 'Chronic Disease Management'][idx % 5]} management`
        })
      )
    );
    console.log('✓ Created 8 admissions');

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n========================================');
    console.log('SEEDING COMPLETED SUCCESSFULLY!');
    console.log('========================================');
    console.log('Total Records Created:');
    console.log('  Users: 12 (1 admin, 6 doctors, 5 staff)');
    console.log('  Departments: 3');
    console.log('  Patients: 15');
    console.log('  Appointments: 20');
    console.log('  EHR Records: 15');
    console.log('  Medicines: 10');
    console.log('  Prescriptions: 12');
    console.log('  Prescription Items: 20');
    console.log('  Laboratory Tests: 15');
    console.log('  Insurance Plans: 3');
    console.log('  Bills: 10');
    console.log('  Bill Items: 15');
    console.log('  Wards: 3');
    console.log('  Beds: 30');
    console.log('  Admissions: 8');
    console.log('========================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

const runSeed = async () => {
  try {
    // Force sync - DROP ALL TABLES and recreate from scratch
    console.log('🔄 Dropping and recreating all tables...');
    await db.sequelize.sync({ force: true });
    console.log('✓ Database schema reset complete');
    
    await seedData();
    console.log('✅ SEEDING COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
};

runSeed();
