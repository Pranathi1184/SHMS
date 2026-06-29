const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');

jest.mock('../src/models');
jest.mock('../src/middlewares/auth', () => ({
  authenticateToken: (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token === 'billing-token') {
      req.user = { id: 'billing-1', role: 'Billing Staff', isActive: true };
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

describe('Insurance API', () => {
  const billingToken = 'billing-token';
  const patientId = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    jest.clearAllMocks();

    db.Patient.findByPk.mockResolvedValue({ id: patientId });
    db.Insurance.create.mockResolvedValue({ id: 'ins-1', patientId, policyNumber: 'POL-123' });
    db.Insurance.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [{ id: 'ins-1', policyNumber: 'POL-123', providerName: 'Acme Health' }],
    });
    db.Insurance.findByPk.mockResolvedValue({
      id: 'ins-1',
      patientId,
      policyNumber: 'POL-123',
      update: jest.fn().mockResolvedValue(true),
      destroy: jest.fn().mockResolvedValue(true),
    });
  });

  test('creates insurance record', async () => {
    const res = await request(app)
      .post('/api/insurance')
      .set('Authorization', `Bearer ${billingToken}`)
      .send({
        patientId,
        providerName: 'Acme Health',
        policyNumber: 'POL-123',
        policyHolderName: 'Asha Rao',
        coverageStartDate: '2026-01-01',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
  });

  test('lists insurance records', async () => {
    const res = await request(app)
      .get('/api/insurance?page=1&limit=10')
      .set('Authorization', `Bearer ${billingToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.insuranceRecords).toHaveLength(1);
  });

  test('rejects invalid patientId format', async () => {
    const res = await request(app)
      .post('/api/insurance')
      .set('Authorization', `Bearer ${billingToken}`)
      .send({
        patientId: '123',
        providerName: 'Acme Health',
        policyNumber: 'POL-123',
        policyHolderName: 'Asha Rao',
        coverageStartDate: '2026-01-01',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
  });
});
