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

describe('EHR API', () => {
  const doctorToken = 'doctor-token';
  const patientId = '11111111-1111-4111-8111-111111111111';
  const doctorId = '22222222-2222-4222-8222-222222222222';

  beforeEach(() => {
    jest.clearAllMocks();

    db.Patient.findByPk.mockResolvedValue({ id: patientId });
    db.Doctor.findByPk.mockResolvedValue({ id: doctorId });
    db.EHR.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [{ id: 'ehr-1', diagnosis: 'Flu' }],
    });
    db.EHR.create.mockResolvedValue({ id: 'ehr-1', patientId, doctorId, diagnosis: 'Flu' });
    db.EHR.findByPk.mockResolvedValue({
      id: 'ehr-1',
      diagnosis: 'Flu',
      toJSON: () => ({ id: 'ehr-1', diagnosis: 'Flu' }),
      update: jest.fn().mockResolvedValue(true),
      destroy: jest.fn().mockResolvedValue(true),
    });
    db.AuditLog.create.mockResolvedValue({});
  });

  test('lists EHR records', async () => {
    const res = await request(app)
      .get('/api/ehr?page=1&limit=10')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.ehrs).toHaveLength(1);
  });

  test('creates EHR record with valid UUID ids', async () => {
    const res = await request(app)
      .post('/api/ehr')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId,
        doctorId,
        diagnosis: 'Flu',
        symptoms: 'Fever',
        treatmentPlan: 'Rest',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
  });

  test('rejects invalid UUID payload', async () => {
    const res = await request(app)
      .post('/api/ehr')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: '1',
        doctorId: '2',
        diagnosis: 'Flu',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
  });
});
