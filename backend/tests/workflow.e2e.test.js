const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');
const { generateAccessToken } = require('../src/utils/jwt');

jest.setTimeout(180000);

describe('SHMS Workflow E2E Verification', () => {
  let adminToken;
  let doctorToken;
  let receptionistToken;
  let labTechToken;
  let pharmacistToken;
  let billingToken;

  let createdDepartmentId;
  let createdPatientId;
  let createdAppointmentId;
  let createdEhrId;
  let createdPrescriptionId;
  let createdLabTestId;
  let createdBillId;
  let createdAdmissionId;

  let workflowDoctorId;
  let workflowMedicineId;
  let workflowBedId;
  let validAppointmentDate = '2027-12-31';
  let validStartTime = '10:00';
  let validEndTime = '10:30';

  const unique = Date.now();

  beforeAll(async () => {
    await db.sequelize.sync();

    const [department] = await db.Department.findOrCreate({
      where: { name: 'General Medicine' },
      defaults: { description: 'Default department for workflow e2e' },
    });

    const [adminUser] = await db.User.findOrCreate({
      where: { email: 'admin@shms.com' },
      defaults: {
        firstName: 'System',
        lastName: 'Admin',
        password: 'password123',
        role: 'Administrator',
        phone: '5550000001',
      },
    });

    let doctor = await db.Doctor.findOne({ include: [{ model: db.User, as: 'user' }] });
    if (!doctor) {
      const [doctorUser] = await db.User.findOrCreate({
        where: { email: 'doctor.seed@shms.com' },
        defaults: {
          firstName: 'Seed',
          lastName: 'Doctor',
          password: 'password123',
          role: 'Doctor',
          phone: '5550000002',
        },
      });

      doctor = await db.Doctor.create({
        userId: doctorUser.id,
        departmentId: department.id,
        specialization: 'General Physician',
        licenseNumber: `LIC-WF-${Date.now()}`,
        consultationFee: 100,
      });
      doctor = await db.Doctor.findByPk(doctor.id, { include: [{ model: db.User, as: 'user' }] });
    }

    const [medicine] = await db.Medicine.findOrCreate({
      where: { name: 'Workflow Cetirizine' },
      defaults: {
        genericName: 'Cetirizine',
        dosageForm: 'Tablet',
        strength: '10mg',
        manufacturer: 'SHMS Pharma',
        batchNumber: `BATCH-${Date.now()}`,
        expiryDate: '2030-12-31',
        purchaseDate: '2026-01-01',
        quantity: 200,
        unitPrice: 5,
        reorderLevel: 20,
        description: 'Workflow seed medicine',
      },
    });
    await medicine.update({ quantity: Math.max(Number(medicine.quantity || 0), 200) });

    let bed = await db.Bed.findOne({ where: { status: 'Available' } });
    if (!bed) {
      const [ward] = await db.Ward.findOrCreate({
        where: { name: 'Workflow General Ward' },
        defaults: {
          departmentId: department.id,
          type: 'General',
          description: 'Workflow seed ward',
        },
      });

      bed = await db.Bed.create({
        wardId: ward.id,
        bedNumber: `WF-${Date.now()}`,
        status: 'Available',
        pricePerDay: 150,
      });
    }

    workflowDoctorId = doctor.id;
    workflowMedicineId = medicine.id;
    workflowBedId = bed.id;

    // Determine a valid appointment date and time based on the doctor's schedule
    const schedule = await db.DoctorSchedule.findOne({ where: { doctorId: doctor.id } });
    const availableDays = schedule?.availableDays?.length ? schedule.availableDays : [1, 2, 3, 4, 5];
    const availableFrom = schedule?.availableFrom || '09:00';
    const availableTo = schedule?.availableTo || '17:00';
    // Pick a start time safely inside the schedule window
    const fromHour = parseInt(availableFrom.split(':')[0], 10);
    const toHour = parseInt(availableTo.split(':')[0], 10);
    const midHour = Math.min(fromHour + 1, toHour - 1);
    validStartTime = `${String(midHour).padStart(2, '0')}:00`;
    validEndTime = `${String(midHour).padStart(2, '0')}:30`;
    // Find the next future date that falls on an available day
    const baseDate = new Date('2027-12-20');
    for (let i = 0; i < 14; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      if (availableDays.includes(d.getUTCDay())) {
        validAppointmentDate = d.toISOString().slice(0, 10);
        break;
      }
    }

    adminToken = generateAccessToken({ id: adminUser.id, role: 'Administrator', email: adminUser.email });
    doctorToken = generateAccessToken({ id: doctor.user.id, role: 'Doctor', email: doctor.user.email });
  });

  it('runs end-to-end hospital workflow successfully', async () => {
    // Administrator: Create Department
    const departmentRes = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Workflow Department ${unique}`,
        description: 'Department created by workflow verification',
      });

    expect(departmentRes.statusCode).toBe(201);
    createdDepartmentId = departmentRes.body.data.id;

    // Administrator: Create Staff (register users for all operational roles)
    const roles = ['Receptionist', 'Lab Technician', 'Pharmacist', 'Billing Staff', 'Nurse'];
    const createdUsers = {};

    for (const role of roles) {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: role.split(' ')[0],
          lastName: 'Workflow',
          email: `${role.toLowerCase().replace(/\s+/g, '.')}.workflow.${unique}@shms.com`,
          password: 'password123',
          role,
          phone: '555-555-5555',
        });

      expect(res.statusCode).toBe(201);
      createdUsers[role] = res.body.data.user;
    }

    receptionistToken = generateAccessToken({
      id: createdUsers['Receptionist'].id,
      role: 'Receptionist',
      email: createdUsers['Receptionist'].email,
    });
    labTechToken = generateAccessToken({
      id: createdUsers['Lab Technician'].id,
      role: 'Lab Technician',
      email: createdUsers['Lab Technician'].email,
    });
    pharmacistToken = generateAccessToken({
      id: createdUsers['Pharmacist'].id,
      role: 'Pharmacist',
      email: createdUsers['Pharmacist'].email,
    });
    billingToken = generateAccessToken({
      id: createdUsers['Billing Staff'].id,
      role: 'Billing Staff',
      email: createdUsers['Billing Staff'].email,
    });

    // Receptionist: Register Patient
    const patientRes = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        firstName: 'Workflow',
        lastName: 'Patient',
        dateOfBirth: '1990-05-10',
        gender: 'Male',
        email: `workflow.patient.${unique}@example.com`,
        phone: '555-101-2020',
        address: '100 Workflow Street',
        bloodType: 'O+',
        allergies: 'None',
        emergencyContactName: 'Workflow Contact',
        emergencyContactPhone: '555-909-8080',
      });

    expect(patientRes.statusCode).toBe(201);
    createdPatientId = patientRes.body.data.id;

    // Receptionist: Book Appointment
    let appointmentRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        patientId: createdPatientId,
        doctorId: workflowDoctorId,
        appointmentDate: validAppointmentDate,
        startTime: validStartTime,
        endTime: validEndTime,
        notes: 'Workflow verification appointment',
      });

    if (appointmentRes.statusCode === 400 && appointmentRes.body?.data?.suggestedSlots?.length > 0) {
      const pick = appointmentRes.body.data.suggestedSlots[0];
      appointmentRes = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          patientId: createdPatientId,
          doctorId: workflowDoctorId,
          appointmentDate: pick.date,
          startTime: pick.start,
          endTime: pick.end,
          notes: 'Workflow verification appointment (fallback slot)',
        });
    }

    if (appointmentRes.statusCode !== 201) {
      throw new Error(`Appointment creation failed: ${JSON.stringify(appointmentRes.body)}`);
    }
    createdAppointmentId = appointmentRes.body.data.id;

    // Doctor: View Appointment
    const viewAppointmentRes = await request(app)
      .get(`/api/appointments/${createdAppointmentId}`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(viewAppointmentRes.statusCode).toBe(200);

    // Doctor: Update EHR (create record)
    const ehrRes = await request(app)
      .post('/api/ehr')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: createdPatientId,
        doctorId: workflowDoctorId,
        appointmentId: createdAppointmentId,
        diagnosis: 'Seasonal allergy',
        symptoms: 'Sneezing and mild congestion',
        treatmentPlan: 'Antihistamine for 5 days',
        notes: 'Follow-up if symptoms worsen',
      });

    expect(ehrRes.statusCode).toBe(201);
    createdEhrId = ehrRes.body.data.id;

    // Doctor: Create Prescription
    const prescriptionRes = await request(app)
      .post('/api/prescriptions')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: createdPatientId,
        doctorId: workflowDoctorId,
        ehrId: createdEhrId,
        notes: 'Take medicine after food',
        items: [
          {
            medicineId: workflowMedicineId,
            dosage: '1 Tablet',
            frequency: 'Twice daily',
            duration: '5 days',
            quantity: 10,
            instructions: 'After meals',
          },
        ],
      });

    expect(prescriptionRes.statusCode).toBe(201);
    createdPrescriptionId = prescriptionRes.body.data.id;

    // Laboratory: Upload Test Result (create + update)
    const orderLabRes = await request(app)
      .post('/api/laboratory-tests')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: createdPatientId,
        doctorId: workflowDoctorId,
        testName: 'Complete Blood Count',
        testCode: 'CBC-WORKFLOW',
        notes: 'Routine test for workflow',
      });

    expect(orderLabRes.statusCode).toBe(201);
    createdLabTestId = orderLabRes.body.data.id;

    const completeLabRes = await request(app)
      .put(`/api/laboratory-tests/${createdLabTestId}`)
      .set('Authorization', `Bearer ${labTechToken}`)
      .send({
        status: 'Completed',
        results: { status: 'Normal', details: 'All values within normal range' },
        notes: 'Completed in workflow verification',
      });

    expect(completeLabRes.statusCode).toBe(200);

    // Pharmacy: Dispense Medicine
    const dispenseRes = await request(app)
      .put(`/api/prescriptions/${createdPrescriptionId}/dispense`)
      .set('Authorization', `Bearer ${pharmacistToken}`);

    expect(dispenseRes.statusCode).toBe(200);

    // Billing: Generate Bill
    const billRes = await request(app)
      .post('/api/bills')
      .set('Authorization', `Bearer ${billingToken}`)
      .send({
        patientId: createdPatientId,
        billNumber: `WF-${unique}`,
        totalAmount: 250,
        discount: 10,
        taxAmount: 20,
        paymentStatus: 'Pending',
        notes: 'Workflow verification bill',
        items: [
          { description: 'Consultation', quantity: 1, unitPrice: 150, totalPrice: 150 },
          { description: 'Lab Test', quantity: 1, unitPrice: 100, totalPrice: 100 },
        ],
      });

    expect(billRes.statusCode).toBe(201);
    createdBillId = billRes.body.data.id;

    // Ward: Admission
    const admissionRes = await request(app)
      .post('/api/ward-management/admissions')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        patientId: createdPatientId,
        doctorId: workflowDoctorId,
        bedId: workflowBedId,
        reasonForAdmission: 'Observation',
        notes: 'Workflow admission',
      });

    expect(admissionRes.statusCode).toBe(201);
    createdAdmissionId = admissionRes.body.data.id;

    // Ward: Discharge
    const dischargeRes = await request(app)
      .put(`/api/ward-management/admissions/${createdAdmissionId}/discharge`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ notes: 'Stable for discharge' });

    expect(dischargeRes.statusCode).toBe(200);
  });
});
