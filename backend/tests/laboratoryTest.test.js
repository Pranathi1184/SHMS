const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');

jest.mock('../src/models');
jest.mock('../src/middlewares/auth', () => ({
  authenticateToken: (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token === 'doctor-token') {
      req.user = { id: 'doc-user-1', role: 'Doctor', isActive: true };
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

describe('Laboratory Test API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.LaboratoryTest.findAndCountAll = jest.fn().mockResolvedValue({
      count: 1,
      rows: [{ id: 'lab-1', testName: 'CBC', status: 'Ordered' }],
    });
  });

  test('lists lab tests', async () => {
    const res = await request(app)
      .get('/api/laboratory-tests?page=1&limit=10')
      .set('Authorization', 'Bearer doctor-token');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.labTests).toHaveLength(1);
  });

  test('rejects invalid patientId filter', async () => {
    const res = await request(app)
      .get('/api/laboratory-tests?patientId=bad-id')
      .set('Authorization', 'Bearer doctor-token');

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
  });
});
