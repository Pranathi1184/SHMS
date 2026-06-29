const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');

jest.mock('../src/models');
jest.mock('../src/middlewares/auth', () => ({
  authenticateToken: (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token === 'admin-token') {
      req.user = { id: 'admin-1', role: 'Administrator', isActive: true };
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

describe('Department API', () => {
  const adminToken = 'admin-token';

  beforeEach(() => {
    jest.clearAllMocks();

    db.User.findByPk.mockResolvedValue({ id: 'admin-1', role: 'Administrator', isActive: true });
    db.Department.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [{ id: 'dep-1', name: 'Cardiology', description: 'Heart care' }],
    });
    db.Department.findByPk.mockResolvedValue({
      id: 'dep-1',
      name: 'Cardiology',
      description: 'Heart care',
      update: jest.fn().mockResolvedValue(true),
      destroy: jest.fn().mockResolvedValue(true),
    });
    db.Department.create.mockResolvedValue({ id: 'dep-1', name: 'Cardiology' });
    db.Doctor.count.mockResolvedValue(0);
    db.Ward.count.mockResolvedValue(0);
  });

  test('lists departments with pagination', async () => {
    const res = await request(app)
      .get('/api/departments?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.departments).toHaveLength(1);
  });

  test('creates a department', async () => {
    const res = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Radiology', description: 'Imaging unit' });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
  });

  test('blocks deleting department with assigned doctors', async () => {
    db.Doctor.count.mockResolvedValue(2);

    const res = await request(app)
      .delete('/api/departments/dep-1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Department cannot be deleted while doctors or wards are assigned');
  });
});
