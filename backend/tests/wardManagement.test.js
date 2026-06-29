const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');

jest.mock('../src/models');
jest.mock('../src/middlewares/auth', () => ({
  authenticateToken: (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token === 'admin-token') {
      req.user = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', role: 'Administrator', isActive: true };
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

describe('Ward Management API', () => {
  const adminToken = 'admin-token';
  const departmentId = '11111111-1111-4111-8111-111111111111';
  const wardId = '22222222-2222-4222-8222-222222222222';

  beforeEach(() => {
    jest.clearAllMocks();

    const tx = {
      commit: jest.fn().mockResolvedValue(true),
      rollback: jest.fn().mockResolvedValue(true),
    };

    db.sequelize = { transaction: jest.fn().mockResolvedValue(tx) };
    db.Department.findByPk = jest.fn().mockResolvedValue({ id: departmentId });
    db.Ward.create = jest.fn().mockResolvedValue({ id: wardId });
    db.Ward.findByPk = jest.fn().mockResolvedValue({ id: wardId, name: 'ICU-1', type: 'ICU' });
    db.Bed.findByPk = jest.fn().mockResolvedValue({
      id: '33333333-3333-4333-8333-333333333333',
      status: 'Occupied',
      update: jest.fn().mockResolvedValue(true),
    });
    db.Bed.count = jest.fn().mockResolvedValue(0);
    db.Patient.findByPk = jest.fn().mockResolvedValue({ id: '44444444-4444-4444-8444-444444444444' });
    db.Doctor.findByPk = jest.fn().mockResolvedValue({ id: '55555555-5555-4555-8555-555555555555' });
    db.Admission.findByPk = jest.fn().mockResolvedValue({ status: 'Discharged' });
    db.Admission.findOne = jest.fn().mockResolvedValue(null);
  });

  test('creates a ward successfully', async () => {
    const res = await request(app)
      .post('/api/ward-management/wards')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'ICU-1',
        departmentId,
        type: 'ICU',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
  });

  test('rejects invalid wardId while creating bed', async () => {
    const res = await request(app)
      .post('/api/ward-management/beds')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        wardId: 'not-a-uuid',
        bedNumber: 'B-01',
        pricePerDay: 2500,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
  });

  test('rejects admission when bed is not available', async () => {
    const res = await request(app)
      .post('/api/ward-management/admissions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        patientId: '44444444-4444-4444-8444-444444444444',
        doctorId: '55555555-5555-4555-8555-555555555555',
        bedId: '33333333-3333-4333-8333-333333333333',
        reasonForAdmission: 'Observation',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Bed is not available');
  });

  test('rejects discharge when patient is not currently admitted', async () => {
    const res = await request(app)
      .put('/api/ward-management/admissions/66666666-6666-4666-8666-666666666666/discharge')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ notes: 'Ready for discharge' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Patient is not currently admitted');
  });
});
