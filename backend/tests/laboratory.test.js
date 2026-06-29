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
    if (token === 'lab-token') {
      req.user = { id: 'lab-user-1', role: 'Lab Technician', isActive: true };
      return next();
    }
    if (token === 'admin-token') {
      req.user = { id: 'admin-1', role: 'Administrator', isActive: true };
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

describe('Laboratory API', () => {
  const doctorToken = 'doctor-token';
  const labToken = 'lab-token';
  const patientId = '11111111-1111-4111-8111-111111111111';
  const doctorId = '22222222-2222-4222-8222-222222222222';

  beforeEach(() => {
    jest.clearAllMocks();

    db.Patient.findByPk.mockResolvedValue({ id: patientId, firstName: 'Asha', lastName: 'Rao' });
    db.Doctor.findByPk.mockResolvedValue({ id: doctorId });
    db.LaboratoryTest.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [{ id: 'lab-1', testName: 'CBC', status: 'Ordered' }],
    });
    db.LaboratoryTest.create.mockResolvedValue({ id: 'lab-1', patientId, doctorId, testName: 'CBC' });
    db.LaboratoryTest.findByPk.mockResolvedValue({
      id: 'lab-1',
      status: 'Ordered',
      update: jest.fn().mockResolvedValue(true),
      destroy: jest.fn().mockResolvedValue(true),
    });
  });

  test('lists lab tests', async () => {
    const res = await request(app)
      .get('/api/laboratory-tests?page=1&limit=10')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.labTests).toHaveLength(1);
  });

  test('creates lab test with valid UUIDs', async () => {
    const res = await request(app)
      .post('/api/laboratory-tests')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId,
        doctorId,
        testName: 'CBC',
        testCode: 'CBC-01',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
  });

  test('updates lab status by lab technician', async () => {
    const res = await request(app)
      .put('/api/laboratory-tests/lab-1')
      .set('Authorization', `Bearer ${labToken}`)
      .send({ status: 'Completed', results: { value: 'Normal' } });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
  });
});
