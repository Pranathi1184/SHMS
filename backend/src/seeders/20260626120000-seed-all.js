'use strict';
const db = require('../models');
const helpers = require('./helpers');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('Starting database seeding...');

    const STAFF_PASSWORD = process.env.SEED_STAFF_PASSWORD || 'password123';
    const PATIENT_PASSWORD = process.env.SEED_PATIENT_PASSWORD || 'patient123';
    const demoPatients = [
      {
        firstName: 'Ananya',
        lastName: 'Iyer',
        dateOfBirth: '1992-04-12',
        gender: 'Female',
        email: 'ananya.iyer.patient@shms.com',
        phone: '555-310-1001',
        address: '24 Lake View Road, Bengaluru, KA 560001',
        bloodType: 'A+',
        allergies: 'Penicillin',
        emergencyContactName: 'Raghav Iyer',
        emergencyContactPhone: '555-410-1001',
      },
      {
        firstName: 'Vikram',
        lastName: 'Nair',
        dateOfBirth: '1985-09-20',
        gender: 'Male',
        email: 'vikram.nair.patient@shms.com',
        phone: '555-310-1002',
        address: '17 MG Road, Kochi, KL 682001',
        bloodType: 'O+',
        allergies: 'None',
        emergencyContactName: 'Meera Nair',
        emergencyContactPhone: '555-410-1002',
      },
      {
        firstName: 'Sana',
        lastName: 'Khan',
        dateOfBirth: '2001-01-15',
        gender: 'Female',
        email: 'sana.khan.patient@shms.com',
        phone: '555-310-1003',
        address: '88 Residency Road, Hyderabad, TS 500001',
        bloodType: 'B+',
        allergies: 'Latex',
        emergencyContactName: 'Arif Khan',
        emergencyContactPhone: '555-410-1003',
      },
      {
        firstName: 'Harish',
        lastName: 'Reddy',
        dateOfBirth: '1978-11-03',
        gender: 'Male',
        email: 'harish.reddy.patient@shms.com',
        phone: '555-310-1004',
        address: '10 Jubilee Hills, Hyderabad, TS 500033',
        bloodType: 'AB-',
        allergies: 'Aspirin',
        emergencyContactName: 'Lakshmi Reddy',
        emergencyContactPhone: '555-410-1004',
      },
      {
        firstName: 'Megha',
        lastName: 'Sharma',
        dateOfBirth: '1997-06-08',
        gender: 'Female',
        email: 'megha.sharma.patient@shms.com',
        phone: '555-310-1005',
        address: '56 Civil Lines, Jaipur, RJ 302001',
        bloodType: 'O-',
        allergies: 'Peanuts',
        emergencyContactName: 'Ritu Sharma',
        emergencyContactPhone: '555-410-1005',
      },
    ];
    const demoUsers = [
      {
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@shms.com',
        role: 'Administrator',
        phone: '555-123-4567',
        password: process.env.SEED_ADMIN_PASSWORD || 'admin123',
      },
      {
        firstName: 'Aarav',
        lastName: 'Mehra',
        email: 'doctor@shms.com',
        role: 'Doctor',
        phone: '555-200-1001',
        password: STAFF_PASSWORD,
      },
      {
        firstName: 'Nisha',
        lastName: 'Rao',
        email: 'nurse@shms.com',
        role: 'Nurse',
        phone: '555-200-1002',
        password: STAFF_PASSWORD,
      },
      {
        firstName: 'Kiran',
        lastName: 'Patel',
        email: 'reception@shms.com',
        role: 'Receptionist',
        phone: '555-200-1003',
        password: STAFF_PASSWORD,
      },
      {
        firstName: 'Maya',
        lastName: 'Sen',
        email: 'lab@shms.com',
        role: 'Lab Technician',
        phone: '555-200-1004',
        password: STAFF_PASSWORD,
      },
      {
        firstName: 'Rohan',
        lastName: 'Das',
        email: 'pharmacy@shms.com',
        role: 'Pharmacist',
        phone: '555-200-1005',
        password: STAFF_PASSWORD,
      },
      {
        firstName: 'Priya',
        lastName: 'Shah',
        email: 'billing@shms.com',
        role: 'Billing Staff',
        phone: '555-200-1006',
        password: STAFF_PASSWORD,
      },
    ];

    const patientPortalUsers = demoPatients.map((patient, index) => ({
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      role: 'Patient',
      phone: patient.phone,
      password: PATIENT_PASSWORD,
      sequence: index + 1,
    }));

    // --------------------------
    // Step 1: Seed Departments
    // --------------------------
    console.log('Seeding departments...');
    const departmentsData = [
      { name: 'Cardiology', description: 'Heart and cardiovascular care' },
      { name: 'Neurology', description: 'Brain and nervous system disorders' },
      { name: 'Orthopedics', description: 'Bone, joint, and muscle care' },
      { name: 'Pediatrics', description: 'Child and infant healthcare' },
      { name: 'Dermatology', description: 'Skin care and treatment' },
      { name: 'Oncology', description: 'Cancer diagnosis and treatment' },
      { name: 'Emergency', description: '24/7 emergency care' },
      { name: 'ICU', description: 'Intensive Care Unit' },
      { name: 'Radiology', description: 'Medical imaging services' },
      { name: 'Laboratory', description: 'Diagnostic testing services' },
    ];
    const createdDepartments = await db.Department.bulkCreate(departmentsData, { returning: true });
    const deptMap = {};
    createdDepartments.forEach(d => { deptMap[d.name] = d; });

    // --------------------------
    // Step 2: Seed Users
    // --------------------------
    console.log('Seeding users...');
    const users = [];
    const roleUserMap = {
      'Administrator': [],
      'Doctor': [],
      'Nurse': [],
      'Receptionist': [],
      'Lab Technician': [],
      'Pharmacist': [],
      'Billing Staff': [],
      'Patient': []
    };

    // Deterministic demo accounts
    for (const demoUser of [...demoUsers, ...patientPortalUsers]) {
      const seeded = {
        id: uuidv4(),
        firstName: demoUser.firstName,
        lastName: demoUser.lastName,
        email: demoUser.email,
        password: await bcrypt.hash(demoUser.password, 10),
        role: demoUser.role,
        phone: demoUser.phone,
        isActive: true,
      };
      users.push(seeded);
      roleUserMap[demoUser.role].push(seeded);
    }

    // Generate users for all roles
    const userCounts = {
      'Administrator': Number(process.env.SEED_ADMIN_USERS || 4),
      'Doctor': Number(process.env.SEED_DOCTOR_USERS || 19),
      'Nurse': Number(process.env.SEED_NURSE_USERS || 24),
      'Receptionist': Number(process.env.SEED_RECEPTIONIST_USERS || 9),
      'Lab Technician': Number(process.env.SEED_LAB_USERS || 9),
      'Pharmacist': Number(process.env.SEED_PHARMACIST_USERS || 7),
      'Billing Staff': Number(process.env.SEED_BILLING_USERS || 7)
    };

    for (const [role, count] of Object.entries(userCounts)) {
      for (let i = 0; i < count; i++) {
        const userData = await helpers.generateUser(role, i + 1);
        users.push(userData);
        roleUserMap[role].push(userData);
      }
    }

    const createdUsers = await db.User.bulkCreate(users, { returning: true });
    const userMap = {};
    createdUsers.forEach(u => {
      if (!userMap[u.role]) userMap[u.role] = [];
      userMap[u.role].push(u);
    });

    // --------------------------
    // Step 3: Seed Doctors
    // --------------------------
    console.log('Seeding doctors...');
    const doctors = [];
    const deptNames = Object.keys(deptMap);
    for (let i = 0; i < userMap['Doctor'].length; i++) {
      const user = userMap['Doctor'][i];
      const deptName = deptNames[i % deptNames.length];
      const dept = deptMap[deptName];
      const specialties = helpers.specialtiesByDepartment[deptName] || ['General Practitioner'];
      doctors.push({
        userId: user.id,
        departmentId: dept.id,
        specialization: helpers.random(specialties),
        licenseNumber: `LIC-${helpers.randomNumber(100000, 999999)}`,
        consultationFee: helpers.randomNumber(50, 300)
      });
    }
    const createdDoctors = await db.Doctor.bulkCreate(doctors, { returning: true });

    // --------------------------
    // Step 4: Seed Wards
    // --------------------------
    console.log('Seeding wards...');
    const wards = [];
    const wardTypes = ['General', 'Semi-Private', 'Private', 'ICU', 'Emergency'];
    for (let i = 0; i < 20; i++) {
      const deptName = deptNames[i % deptNames.length];
      wards.push({
        name: `${deptName} Ward ${i + 1}`,
        departmentId: deptMap[deptName].id,
        type: helpers.random(wardTypes),
        description: `Ward for ${deptName.toLowerCase()} patients`
      });
    }
    const createdWards = await db.Ward.bulkCreate(wards, { returning: true });

    // --------------------------
    // Step 5: Seed Beds
    // --------------------------
    console.log('Seeding beds...');
    const beds = [];
    const bedStatuses = ['Available', 'Occupied', 'Maintenance'];
    createdWards.forEach((ward, idx) => {
      const bedCount = helpers.randomNumber(4, 12);
      for (let i = 0; i < bedCount; i++) {
        beds.push({
          wardId: ward.id,
          bedNumber: `${idx + 1}-${i + 1}`,
          status: helpers.random(bedStatuses),
          pricePerDay: helpers.randomNumber(100, 800)
        });
      }
    });
    const createdBeds = await db.Bed.bulkCreate(beds, { returning: true });

    // --------------------------
    // Step 6: Seed Medicines
    // --------------------------
    console.log('Seeding medicines...');
    const medicines = [];
    const MEDICINE_COUNT = Number(process.env.SEED_MEDICINES || 220);
    for (let i = 0; i < MEDICINE_COUNT; i++) {
      const medData = helpers.generateMedicine(i);
      medicines.push({
        name: medData.name,
        genericName: medData.genericName,
        dosageForm: medData.dosageForm,
        strength: medData.strength,
        manufacturer: medData.manufacturer,
        batchNumber: medData.batchNumber,
        expiryDate: medData.expiryDate,
        purchaseDate: medData.purchaseDate,
        quantity: medData.quantity,
        unitPrice: medData.unitPrice,
        reorderLevel: medData.reorderLevel,
        description: medData.description
      });
    }
    const createdMedicines = await db.Medicine.bulkCreate(medicines, { returning: true });

    // --------------------------
    // Step 7: Seed Patients
    // --------------------------
    console.log('Seeding patients...');
    const patients = [];
    demoPatients.forEach((patient) => {
      patients.push({
        id: uuidv4(),
        ...patient,
      });
    });

    const PATIENT_COUNT = Number(process.env.SEED_PATIENTS || 600);
    const randomPatientCount = Math.max(PATIENT_COUNT - demoPatients.length, 0);
    for (let i = 0; i < randomPatientCount; i++) {
      const pData = helpers.generatePatient(i);
      patients.push(pData);
    }
    const createdPatients = await db.Patient.bulkCreate(patients, { returning: true });

    // --------------------------
    // Step 7.1: Seed Patient Portal Users (Readable Demo Set)
    // --------------------------
    console.log('Seeding patient portal users...');
    const PATIENT_PORTAL_USER_COUNT = Number(process.env.SEED_PATIENT_PORTAL_USERS || 120);
    const existingPatientEmails = new Set(users.map((u) => u.email));
    const additionalPatientUsers = [];

    for (const patient of createdPatients.slice(0, PATIENT_PORTAL_USER_COUNT)) {
      if (existingPatientEmails.has(patient.email)) continue;

      additionalPatientUsers.push({
        id: uuidv4(),
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        password: await bcrypt.hash(PATIENT_PASSWORD, 10),
        role: 'Patient',
        phone: patient.phone,
        isActive: true,
      });
      existingPatientEmails.add(patient.email);
    }

    if (additionalPatientUsers.length > 0) {
      const createdPatientUsers = await db.User.bulkCreate(additionalPatientUsers, { returning: true });
      createdUsers.push(...createdPatientUsers);
      if (!userMap['Patient']) userMap['Patient'] = [];
      userMap['Patient'].push(...createdPatientUsers);
    }

    // --------------------------
    // Step 8: Seed Insurance
    // --------------------------
    console.log('Seeding insurance...');
    const insurance = [];
    const coverageTypes = ['Full Coverage', 'Partial Coverage', 'Dental Only', 'Vision Only'];
    createdPatients.forEach(patient => {
      if (Math.random() > 0.3) { // 70% have insurance
        const provider = helpers.random(helpers.insuranceProviders);
        insurance.push({
          patientId: patient.id,
          providerName: provider.name,
          policyNumber: `${provider.policyNumberPrefix}${helpers.randomNumber(100000, 999999)}`,
          policyHolderName: `${patient.firstName} ${patient.lastName}`,
          relationshipToPatient: 'Self',
          coverageStartDate: helpers.randomPastDate(3),
          coverageEndDate: helpers.randomFutureDate(365),
          coverageDetails: helpers.random(coverageTypes)
        });
      }
    });
    const createdInsurance = await db.Insurance.bulkCreate(insurance, { returning: true });
    const patientInsuranceMap = {};
    createdInsurance.forEach(ins => { patientInsuranceMap[ins.patientId] = ins; });

    // --------------------------
    // Step 9: Seed Appointments
    // --------------------------
    console.log('Seeding appointments...');
    const appointments = [];
    const appointmentStatuses = ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'];
    const timeSlots = ['09:00:00', '09:30:00', '10:00:00', '10:30:00', '11:00:00', '11:30:00', '13:00:00', '13:30:00', '14:00:00', '14:30:00', '15:00:00', '15:30:00'];

    const APPOINTMENT_COUNT = Number(process.env.SEED_APPOINTMENTS || 1600);
    for (let i = 0; i < APPOINTMENT_COUNT; i++) {
      const patient = helpers.random(createdPatients);
      const doctor = helpers.random(createdDoctors);
      const isPast = Math.random() > 0.25; // 75% past appointments
      const apptDate = isPast ? helpers.randomPastDate(0.5) : helpers.randomFutureDate(30);
      const timeSlot = helpers.random(timeSlots);
      const endHour = parseInt(timeSlot.split(':')[0]) + 1;
      const endTime = `${endHour.toString().padStart(2, '0')}:${timeSlot.split(':')[1]}:00`;
      let status = helpers.random(appointmentStatuses);
      if (!isPast && (status === 'Completed' || status === 'Cancelled')) {
        status = 'Scheduled';
      }

      appointments.push({
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDate: apptDate,
        startTime: timeSlot,
        endTime: endTime,
        status,
        notes: status === 'Completed' ? 'Patient consultation completed' : null,
        createdBy: helpers.random(userMap['Receptionist'].concat(userMap['Administrator'])).id
      });
    }
    const createdAppointments = await db.Appointment.bulkCreate(appointments, { returning: true });

    // --------------------------
    // Step 10: Seed EHR
    // --------------------------
    console.log('Seeding EHR records...');
    const ehrRecords = [];
    const diagnoses = ['Hypertension', 'Type 2 Diabetes', 'Asthma', 'Upper Respiratory Infection', 'Back Pain', 'Migraine', 'Arthritis', 'Allergic Reaction'];
    const symptomsList = ['Headache', 'Fatigue', 'Cough', 'Fever', 'Shortness of breath', 'Joint pain', 'Nausea'];

    const EHR_COUNT = Number(process.env.SEED_EHR || 550);
    for (let i = 0; i < EHR_COUNT; i++) {
      const patient = helpers.random(createdPatients);
      const doctor = helpers.random(createdDoctors);
      const appt = createdAppointments[i % createdAppointments.length];

      ehrRecords.push({
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentId: appt ? appt.id : null,
        diagnosis: helpers.random(diagnoses),
        symptoms: helpers.random(symptomsList),
        treatmentPlan: 'Prescribed medication and follow-up in 2 weeks',
        notes: 'Patient responding well to treatment',
        createdBy: helpers.random(userMap['Doctor'].concat(userMap['Administrator'])).id
      });
    }
    const createdEHR = await db.EHR.bulkCreate(ehrRecords, { returning: true });

    // --------------------------
    // Step 11: Seed Lab Tests
    // --------------------------
    console.log('Seeding lab tests...');
    const labTests = [];
    const testNames = ['Complete Blood Count', 'Blood Chemistry Panel', 'Urine Analysis', 'X-Ray', 'CT Scan', 'MRI'];
    const testStatuses = ['Ordered', 'Sample Collected', 'In Progress', 'Completed', 'Cancelled'];

    const LAB_TEST_COUNT = Number(process.env.SEED_LAB_TESTS || 450);
    for (let i = 0; i < LAB_TEST_COUNT; i++) {
      const patient = helpers.random(createdPatients);
      const doctor = helpers.random(createdDoctors);
      const appt = createdAppointments[i % createdAppointments.length];
      const status = helpers.random(testStatuses);
      labTests.push({
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentId: appt ? appt.id : null,
        testName: helpers.random(testNames),
        orderDate: helpers.randomPastDate(2),
        sampleCollectedDate: status !== 'Ordered' ? helpers.randomPastDate(1.5) : null,
        resultDate: status === 'Completed' ? helpers.randomPastDate(0.5) : null,
        results: status === 'Completed' ? { status: 'Normal', summary: 'Results within normal limits' } : null,
        status,
        notes: status === 'Completed' ? 'Test completed successfully' : null,
        orderedBy: helpers.random(userMap['Doctor'].concat(userMap['Administrator'])).id,
        performedBy: status === 'Completed' ? helpers.random(userMap['Lab Technician'].concat(userMap['Administrator'])).id : null
      });
    }
    const createdLabTests = await db.LaboratoryTest.bulkCreate(labTests, { returning: true });

    // --------------------------
    // Step 12: Seed Prescriptions & Items
    // --------------------------
    console.log('Seeding prescriptions...');
    const prescriptions = [];
    const prescriptionItems = [];
    const prescriptionStatuses = ['Pending', 'Dispensed', 'Cancelled'];

    const PRESCRIPTION_COUNT = Number(process.env.SEED_PRESCRIPTIONS || 520);
    for (let i = 0; i < PRESCRIPTION_COUNT; i++) {
      const patient = helpers.random(createdPatients);
      const doctor = helpers.random(createdDoctors);
      const ehr = createdEHR[i % createdEHR.length];
      const prescId = uuidv4();
      const status = helpers.random(prescriptionStatuses);

      prescriptions.push({
        id: prescId,
        patientId: patient.id,
        doctorId: doctor.id,
        ehrId: ehr ? ehr.id : null,
        prescriptionDate: helpers.randomPastDate(2),
        notes: 'Take as directed',
        status,
        createdBy: helpers.random(userMap['Doctor'].concat(userMap['Administrator'])).id
      });

      // Add prescription items
      const itemCount = helpers.randomNumber(1, 4);
      for (let j = 0; j < itemCount; j++) {
        const med = helpers.random(createdMedicines);
        prescriptionItems.push({
          prescriptionId: prescId,
          medicineId: med.id,
          dosage: `1 ${med.dosageForm.toLowerCase()}`,
          frequency: 'Once daily',
          duration: '14 days',
          quantity: 14,
          instructions: 'Take with food'
        });
      }
    }

    const createdPrescriptions = await db.Prescription.bulkCreate(prescriptions, { returning: true });
    const createdPrescriptionItems = await db.PrescriptionItem.bulkCreate(prescriptionItems, { returning: true });

    // --------------------------
    // Step 13: Seed Admissions
    // --------------------------
    console.log('Seeding admissions...');
    const admissions = [];
    const admissionStatuses = ['Admitted', 'Discharged', 'Transferred'];
    const availableBeds = createdBeds.filter(b => b.status === 'Available');

    const ADMISSION_COUNT = Number(process.env.SEED_ADMISSIONS || 180);
    for (let i = 0; i < ADMISSION_COUNT; i++) {
      const patient = helpers.random(createdPatients);
      const doctor = helpers.random(createdDoctors);
      const bed = helpers.random(availableBeds);
      const admissionDate = helpers.randomPastDate(0.5);
      const status = helpers.random(admissionStatuses);
      const discharged = status === 'Discharged';

      admissions.push({
        patientId: patient.id,
        doctorId: doctor.id,
        bedId: bed.id,
        admissionDate: admissionDate,
        dischargeDate: discharged ? helpers.randomDate(admissionDate, new Date()) : null,
        reasonForAdmission: helpers.random(['Chest pain', 'Fracture', 'Pneumonia', 'Surgery', 'Observation']),
        status,
        notes: 'Patient admitted for treatment',
        admittedBy: helpers.random(userMap['Administrator'].concat(userMap['Nurse'], userMap['Doctor'])).id,
        dischargedBy: discharged ? helpers.random(userMap['Administrator'].concat(userMap['Nurse'], userMap['Doctor'])).id : null
      });
    }
    const createdAdmissions = await db.Admission.bulkCreate(admissions, { returning: true });

    // --------------------------
    // Step 14: Seed Bills
    // --------------------------
    console.log('Seeding bills...');
    const bills = [];
    const billItems = [];
    const paymentStatuses = ['Pending', 'Paid', 'Partially Paid', 'Cancelled'];
    const paymentModes = ['Cash', 'Card', 'UPI', 'Insurance', 'Net Banking', 'Other'];

    const BILL_COUNT = Number(process.env.SEED_BILLS || 500);
    for (let i = 0; i < BILL_COUNT; i++) {
      const patient = helpers.random(createdPatients);
      const appt = createdAppointments[i % createdAppointments.length];
      const insurance = patientInsuranceMap[patient.id];
      const billId = uuidv4();
      const totalAmount = helpers.randomNumber(50, 5000);
      const discount = Math.random() > 0.7 ? helpers.randomNumber(0, 500) : 0;
      const tax = Math.round(totalAmount * 0.08);
      const netAmount = totalAmount - discount + tax;
      const paymentStatus = helpers.random(paymentStatuses);

      bills.push({
        id: billId,
        patientId: patient.id,
        appointmentId: appt ? appt.id : null,
        billNumber: `BILL-${helpers.randomNumber(100000, 999999)}`,
        billDate: helpers.randomPastDate(2),
        totalAmount,
        discount,
        taxAmount: tax,
        netAmount,
        paymentMode: paymentStatus === 'Paid' || paymentStatus === 'Partially Paid' ? helpers.random(paymentModes) : null,
        paymentStatus,
        insuranceId: insurance ? insurance.id : null,
        notes: 'Hospital charges',
        createdBy: helpers.random(userMap['Administrator'].concat(userMap['Billing Staff'])).id
      });

      const itemCount = helpers.randomNumber(1, 5);
      for (let j = 0; j < itemCount; j++) {
        const itemDesc = helpers.random(['Consultation', 'Medication', 'Lab Test', 'X-Ray', 'Room Charge']);
        const qty = helpers.randomNumber(1, 3);
        const price = helpers.randomNumber(20, 500);
        billItems.push({
          billId,
          description: itemDesc,
          quantity: qty,
          unitPrice: price,
          totalPrice: qty * price
        });
      }
    }

    const createdBills = await db.Bill.bulkCreate(bills, { returning: true });
    const createdBillItems = await db.BillItem.bulkCreate(billItems, { returning: true });

    // --------------------------
    // Step 15: Seed Notifications
    // --------------------------
    console.log('Seeding notifications...');
    const notifications = [];
    const notificationTypes = ['Appointment', 'Test Result', 'Bill', 'System'];

    const NOTIFICATION_COUNT = Number(process.env.SEED_NOTIFICATIONS || 350);
    for (let i = 0; i < NOTIFICATION_COUNT; i++) {
      const user = helpers.random(createdUsers);
      const type = helpers.random(notificationTypes);
      notifications.push({
        userId: user.id,
        title: `New ${type} Notification`,
        message: `You have a new ${type.toLowerCase()} notification`,
        type,
        read: Math.random() > 0.6,
        relatedId: null
      });
    }
    const createdNotifications = await db.Notification.bulkCreate(notifications, { returning: true });

    // --------------------------
    // Step 16: Seed Doctor Schedules
    // --------------------------
    console.log('Seeding doctor schedules...');
    const schedules = [];
    const dayOptions = [
      [1, 2, 3, 4, 5],           // Monday-Friday
      [1, 3, 5],                 // Monday, Wednesday, Friday
      [2, 4, 6],                 // Tuesday, Thursday, Saturday
      [1, 2, 3, 4, 5, 6],       // Monday-Saturday
    ];
    for (const doctor of createdDoctors) {
      schedules.push({
        doctorId: doctor.id,
        availableFrom: helpers.random(['08:00', '09:00', '09:30']),
        availableTo: helpers.random(['16:00', '17:00', '17:30', '18:00']),
        slotDurationMinutes: helpers.random([15, 20, 30]),
        availableDays: helpers.random(dayOptions),
        runningLate: Math.random() > 0.8,
        lateDelayMinutes: Math.random() > 0.8 ? helpers.randomNumber(5, 30) : 0,
        lateUpdatedAt: Math.random() > 0.8 ? new Date() : null,
      });
    }
    await db.DoctorSchedule.bulkCreate(schedules);

    // --------------------------
    // Step 17: Seed No-Show Predictions
    // --------------------------
    console.log('Seeding no-show predictions...');
    const noShowPredictions = [];
    const scheduledAppointments = createdAppointments.filter(a => a.status === 'Scheduled');
    const riskLabels = ['Low', 'Medium', 'High'];
    const riskRecommendations = [
      'Standard confirmation sufficient.',
      'Send extra reminder 24h before appointment.',
      'High risk – call patient directly to confirm.',
    ];
    const predictionCount = Math.min(scheduledAppointments.length, 200);
    for (let i = 0; i < predictionCount; i++) {
      const appt = scheduledAppointments[i];
      const riskScore = Math.round(Math.random() * 100) / 100;
      const labelIdx = riskScore < 0.3 ? 0 : riskScore < 0.7 ? 1 : 2;
      noShowPredictions.push({
        appointment_id: appt.id,
        score_date: new Date().toISOString().slice(0, 10),
        risk_score: riskScore,
        risk_label: riskLabels[labelIdx],
        recommendation: riskRecommendations[labelIdx],
      });
    }
    await db.NoShowPrediction.bulkCreate(noShowPredictions);

    // --------------------------
    // Step 18: Seed Bed Occupancy Forecast
    // --------------------------
    console.log('Seeding bed occupancy forecast...');
    const bedForecasts = [];
    const forecastWardTypes = ['General', 'ICU', 'Pediatrics', 'Maternity', 'Surgical', 'Emergency'];
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + dayOffset);
      const dateStr = forecastDate.toISOString().slice(0, 10);
      for (const wt of forecastWardTypes) {
        bedForecasts.push({
          date: dateStr,
          ward_type: wt,
          predicted_occupancy_rate: helpers.randomNumber(30, 95),
        });
      }
    }
    await db.BedOccupancyForecast.bulkCreate(bedForecasts);

    // --------------------------
    // Step 19: Seed Doctor Load Forecast
    // --------------------------
    console.log('Seeding doctor load forecast...');
    const doctorLoadForecasts = [];
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + dayOffset);
      const dateStr = forecastDate.toISOString().slice(0, 10);
      for (const doctor of createdDoctors) {
        doctorLoadForecasts.push({
          forecast_date: dateStr,
          doctor_id: doctor.id,
          predicted_appointments: helpers.randomNumber(2, 18),
          recommendation: helpers.random([
            'Normal workload expected.',
            'Heavy load – consider redistributing walk-ins.',
            'Light schedule – available for urgent cases.',
            'At capacity – block new bookings.',
          ]),
        });
      }
    }
    await db.DoctorLoadForecast.bulkCreate(doctorLoadForecasts);

    // --------------------------
    // Step 20: Seed Medicine Demand Forecast
    // --------------------------
    console.log('Seeding medicine demand forecast...');
    const medicineDemandForecasts = [];
    const forecastMedicines = createdMedicines.slice(0, 30);
    for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
      const forecastMonth = new Date();
      forecastMonth.setMonth(forecastMonth.getMonth() + monthOffset);
      forecastMonth.setDate(1);
      const dateStr = forecastMonth.toISOString().slice(0, 10);
      for (const med of forecastMedicines) {
        medicineDemandForecasts.push({
          medicine_name: med.name,
          month: dateStr,
          predicted_quantity: helpers.randomNumber(20, 300),
          confidence: Math.round(Math.random() * 40 + 60) / 100, // 0.6 - 1.0
        });
      }
    }
    await db.MedicineDemandForecast.bulkCreate(medicineDemandForecasts);

    // --------------------------
    // Step 21: Seed Billing Risk Scores
    // --------------------------
    console.log('Seeding billing risk scores...');
    const billingRiskScores = [];
    const pendingBills = createdBills.filter(b => b.paymentStatus === 'Pending' || b.paymentStatus === 'Partially Paid');
    const riskBillCount = Math.min(pendingBills.length, 150);
    for (let i = 0; i < riskBillCount; i++) {
      const bill = pendingBills[i];
      const score = Math.round(Math.random() * 100) / 100;
      const label = score < 0.3 ? 'Low' : score < 0.7 ? 'Medium' : 'High';
      billingRiskScores.push({
        bill_id: bill.id,
        score_date: new Date().toISOString().slice(0, 10),
        risk_score: score,
        risk_label: label,
        recommendation: label === 'High'
          ? 'Escalate – patient has history of late payments.'
          : label === 'Medium'
          ? 'Send payment reminder before due date.'
          : 'Low risk – standard follow-up.',
      });
    }
    await db.BillingRiskScore.bulkCreate(billingRiskScores);

    // --------------------------
    // Step 22: Seed Insurance Claims
    // --------------------------
    console.log('Seeding insurance claims...');
    const claimsData = [];
    const claimStatuses = ['Submitted', 'Under Verification', 'Approved', 'Rejected', 'Paid'];
    const billsWithInsurance = createdBills.filter(b => b.insuranceId);
    const claimCount = Math.min(billsWithInsurance.length, 100);
    for (let i = 0; i < claimCount; i++) {
      const bill = billsWithInsurance[i];
      const status = helpers.random(claimStatuses);
      const claimAmount = bill.netAmount || helpers.randomNumber(100, 5000);
      const approved = status === 'Approved' || status === 'Paid';
      claimsData.push({
        insuranceId: bill.insuranceId,
        patientId: bill.patientId,
        billId: bill.id,
        claimNumber: `CLM-${helpers.randomNumber(100000, 999999)}`,
        claimAmount: claimAmount,
        approvedAmount: approved ? Math.round(claimAmount * (helpers.randomNumber(70, 100) / 100)) : null,
        status,
        rejectionReason: status === 'Rejected' ? helpers.random([
          'Pre-authorization not obtained',
          'Service not covered under plan',
          'Documentation incomplete',
          'Claim filed after deadline',
        ]) : null,
        payoutDate: status === 'Paid' ? helpers.randomPastDate(0.5) : null,
      });
    }
    await db.Claim.bulkCreate(claimsData);

    console.log('\n--------------------------');
    console.log('Seeding completed successfully!');
    console.log('--------------------------');
    console.log('Default Login Accounts:');
    console.table([
      { Role: 'Administrator', Username: 'admin@shms.com', Email: 'admin@shms.com', Password: process.env.SEED_ADMIN_PASSWORD || 'admin123' },
      { Role: 'Doctor', Username: 'doctor@shms.com', Email: 'doctor@shms.com', Password: STAFF_PASSWORD },
      { Role: 'Nurse', Username: 'nurse@shms.com', Email: 'nurse@shms.com', Password: STAFF_PASSWORD },
      { Role: 'Receptionist', Username: 'reception@shms.com', Email: 'reception@shms.com', Password: STAFF_PASSWORD },
      { Role: 'Lab Technician', Username: 'lab@shms.com', Email: 'lab@shms.com', Password: STAFF_PASSWORD },
      { Role: 'Pharmacist', Username: 'pharmacy@shms.com', Email: 'pharmacy@shms.com', Password: STAFF_PASSWORD },
      { Role: 'Billing Staff', Username: 'billing@shms.com', Email: 'billing@shms.com', Password: STAFF_PASSWORD },
      { Role: 'Patient', Username: 'ananya.iyer.patient@shms.com', Email: 'ananya.iyer.patient@shms.com', Password: PATIENT_PASSWORD }
    ]);
    console.log(`\nCreated ${createdUsers.length} total users`);
    console.log(`Created ${createdDepartments.length} departments`);
    console.log(`Created ${createdDoctors.length} doctors`);
    console.log(`Created ${createdPatients.length} patients`);
    console.log(`Created ${createdAppointments.length} appointments`);
    console.log(`Created ${createdMedicines.length} medicines`);
    console.log('--------------------------\n');

  },

  async down(queryInterface, Sequelize) {
    console.log('Undoing all seeds...');

    // Delete in reverse order to maintain foreign key constraints
    await queryInterface.bulkDelete('claims', null, {});
    await queryInterface.bulkDelete('billing_risk_scores', null, {});
    await queryInterface.bulkDelete('medicine_demand_forecast', null, {});
    await queryInterface.bulkDelete('doctor_load_forecast', null, {});
    await queryInterface.bulkDelete('bed_occupancy_forecast', null, {});
    await queryInterface.bulkDelete('no_show_predictions', null, {});
    await queryInterface.bulkDelete('doctor_schedules', null, {});
    await queryInterface.bulkDelete('notifications', null, {});
    await queryInterface.bulkDelete('bill_items', null, {});
    await queryInterface.bulkDelete('bills', null, {});
    await queryInterface.bulkDelete('admissions', null, {});
    await queryInterface.bulkDelete('prescription_items', null, {});
    await queryInterface.bulkDelete('prescriptions', null, {});
    await queryInterface.bulkDelete('laboratory_tests', null, {});
    await queryInterface.bulkDelete('ehr', null, {});
    await queryInterface.bulkDelete('appointments', null, {});
    await queryInterface.bulkDelete('insurance', null, {});
    await queryInterface.bulkDelete('patients', null, {});
    await queryInterface.bulkDelete('medicines', null, {});
    await queryInterface.bulkDelete('beds', null, {});
    await queryInterface.bulkDelete('wards', null, {});
    await queryInterface.bulkDelete('doctors', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('departments', null, {});
  }
};
