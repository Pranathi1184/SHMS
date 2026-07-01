const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');

const ADMIN_ID = '10000000-0000-4000-8000-000000000001';
const PATIENT_USER_ID = '10000000-0000-4000-8000-000000000002';
const DOCTOR_USER_ID = '10000000-0000-4000-8000-000000000003';
const PATIENT_ID = '20000000-0000-4000-8000-000000000001';
const DOCTOR_ID = '30000000-0000-4000-8000-000000000001';
const APPOINTMENT_ID = '40000000-0000-4000-8000-000000000001';

jest.mock('../src/models');
jest.mock('../src/middlewares/auth', () => ({
  authenticateToken: (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token === 'admin-token') {
      req.user = { id: ADMIN_ID, role: 'Administrator', isActive: true };
      return next();
    }
    if (token === 'patient-token') {
      req.user = { id: PATIENT_USER_ID, role: 'Patient', email: 'patient@example.com', isActive: true };
      return next();
    }
    if (token === 'doctor-token') {
      req.user = { id: DOCTOR_USER_ID, role: 'Doctor', email: 'doctor@example.com', isActive: true };
      return next();
    }
    return res.status(401).json({ status: 'error', message: 'Access token is required' });
  },
  authorizeRoles: (...roles) => (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'error', message: 'Forbidden - Insufficient permissions' });
    }
    return next();
  },
}));

describe('Appointment API', () => {
  let adminToken;
  let patientToken;
  let doctorToken;

  beforeAll(() => {
    adminToken = 'admin-token';
    patientToken = 'patient-token';
    doctorToken = 'doctor-token';
  });

  beforeEach(() => {
    jest.clearAllMocks();

    db.User.findByPk.mockResolvedValue({ id: ADMIN_ID, role: 'Administrator', isActive: true });

    db.Patient.findOne.mockResolvedValue({ id: PATIENT_ID, email: 'patient@example.com' });
    db.Patient.findByPk.mockResolvedValue({ id: PATIENT_ID, email: 'patient@example.com' });
    db.Doctor.findByPk.mockResolvedValue({
      id: DOCTOR_ID,
      consultationFee: 100,
      doctorSchedule: {
        availableDays: [1, 2, 3, 4, 5],
        availableFrom: '09:00:00',
        availableTo: '17:00:00',
        slotDurationMinutes: 30,
      },
    });

    db.Appointment.findAll.mockResolvedValue([]);
    db.Appointment.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [
        {
          id: APPOINTMENT_ID,
          status: 'Scheduled',
          patient: { firstName: 'Pat', lastName: 'Ient', email: 'patient@example.com' },
          doctor: { user: { firstName: 'Doc', lastName: 'Tor' }, department: { name: 'Cardiology' } },
        },
      ],
    });
    db.Appointment.findByPk.mockResolvedValue({
      id: APPOINTMENT_ID,
      patientId: PATIENT_ID,
      doctorId: DOCTOR_ID,
      status: 'Scheduled',
      update: jest.fn().mockResolvedValue(true),
    });
    db.Appointment.create.mockImplementation(async (payload) => ({ id: APPOINTMENT_ID, ...payload }));
    db.AppointmentBillingLink.findOne.mockResolvedValue(null);
    db.AppointmentBillingLink.create.mockResolvedValue({ id: 'link-1' });
    db.Bill.create.mockResolvedValue({ id: 'bill-1' });
    db.BillItem.create.mockResolvedValue({ id: 'bill-item-1' });
    db.EHR.findOne.mockResolvedValue(null);
    db.LaboratoryTest.count.mockResolvedValue(0);
    db.WaitlistEntry.findOne.mockResolvedValue(null);
    db.WaitlistEntry.findAll.mockResolvedValue([]);
    db.WaitlistEntry.create.mockResolvedValue({ id: 'wait-1' });
    db.Notification.create?.mockResolvedValue?.({});
    db.User.findAll.mockResolvedValue([{ id: 'billing-user-1' }]);

    db.sequelize.transaction = jest.fn().mockResolvedValue({
      commit: jest.fn(),
      rollback: jest.fn(),
    });
  });

  test('returns appointment list with filters metadata', async () => {
    const res = await request(app)
      .get('/api/appointments?search=pat&status=Scheduled')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.appointments).toHaveLength(1);
    expect(res.body.data.filters).toEqual({ search: 'pat', status: 'Scheduled' });
  });

  test('creates an appointment successfully', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        patientId: PATIENT_ID,
        doctorId: DOCTOR_ID,
        appointmentDate: '2026-07-01',
        startTime: '09:00',
        endTime: '09:30',
        notes: 'Annual checkup',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(db.Appointment.create).toHaveBeenCalled();
  });

  test('returns suggested slots and waitlist when slot is already booked', async () => {
    db.Appointment.findAll.mockResolvedValueOnce([
      {
        startTime: '09:00:00',
        endTime: '09:30:00',
      },
    ]);

    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        patientId: PATIENT_ID,
        doctorId: DOCTOR_ID,
        appointmentDate: '2026-07-01',
        startTime: '09:00',
        endTime: '09:30',
        notes: 'Overlap test',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Time slot is already booked');
    expect(res.body.data.waitlistJoined).toBe(true);
    expect(Array.isArray(res.body.data.suggestedSlots)).toBe(true);
  });

  test('returns appointment details for an authorized admin', async () => {
    db.User.findByPk.mockResolvedValue({ id: ADMIN_ID, role: 'Administrator', isActive: true });

    const res = await request(app)
      .get(`/api/appointments/${APPOINTMENT_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toBeTruthy();
  });
});
