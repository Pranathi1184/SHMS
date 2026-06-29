const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');

jest.mock('../src/models');
jest.mock('../src/middlewares/auth', () => ({
  authenticateToken: (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token === 'doctor-token') {
      req.user = { id: 'doctor-user-1', role: 'Doctor', isActive: true };
      return next();
    }
    if (token === 'pharmacist-token') {
      req.user = { id: 'pharmacist-1', role: 'Pharmacist', isActive: true };
      return next();
    }
    return res.status(401).json({ status: 'error', message: 'Access token is required' });
  },
  authorizeRoles: (...roles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'error', message: 'Forbidden - Insufficient permissions' });
    }
    return next();
  },
}));

describe('Prescription API', () => {
  const doctorToken = 'doctor-token';
  const pharmacistToken = 'pharmacist-token';
  const patientId = '11111111-1111-4111-8111-111111111111';
  const doctorId = '22222222-2222-4222-8222-222222222222';
  const medicineId = '33333333-3333-4333-8333-333333333333';

  beforeEach(() => {
    jest.clearAllMocks();

    db.sequelize.transaction = jest.fn().mockResolvedValue({
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    });

    db.Patient.findByPk.mockResolvedValue({ id: patientId });
    db.Doctor.findByPk.mockResolvedValue({ id: doctorId });
    db.Prescription.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [{ id: 'pre-1', status: 'Pending' }],
    });
    db.Prescription.create.mockResolvedValue({ id: 'pre-1', patientId, doctorId, status: 'Pending' });
    db.PrescriptionItem.create.mockResolvedValue({ id: 'pre-item-1' });
    db.Prescription.findByPk.mockResolvedValue({
      id: 'pre-1',
      status: 'Pending',
      items: [{ medicineId, quantity: 1 }],
      toJSON: () => ({ status: 'Pending' }),
      update: jest.fn().mockResolvedValue(true),
      destroy: jest.fn().mockResolvedValue(true),
    });
    db.Medicine.findByPk.mockResolvedValue({
      id: medicineId,
      name: 'Paracetamol',
      quantity: 20,
      update: jest.fn().mockResolvedValue(true),
    });
    db.AuditLog.create.mockResolvedValue({});
  });

  test('lists prescriptions', async () => {
    const res = await request(app)
      .get('/api/prescriptions?page=1&limit=10')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.prescriptions).toHaveLength(1);
  });

  test('creates prescription with uuid payload', async () => {
    const res = await request(app)
      .post('/api/prescriptions')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId,
        doctorId,
        notes: 'Take after food',
        items: [
          {
            medicineId,
            dosage: '1 tablet',
            frequency: 'Twice daily',
            duration: '5 days',
            quantity: 10,
          },
        ],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
  });

  test('rejects dispense when prescription is not pending', async () => {
    db.Prescription.findByPk.mockResolvedValue({
      id: 'pre-1',
      status: 'Dispensed',
      items: [{ medicineId, quantity: 1 }],
      toJSON: () => ({ status: 'Dispensed' }),
      update: jest.fn().mockResolvedValue(true),
    });

    const res = await request(app)
      .put('/api/prescriptions/pre-1/dispense')
      .set('Authorization', `Bearer ${pharmacistToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Prescription is not pending');
  });
});
