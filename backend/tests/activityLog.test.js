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
    if (!req.user) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'error', message: 'Forbidden - Insufficient permissions' });
    }
    return next();
  },
}));

describe('Activity Log API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.AuditLog.findAndCountAll = jest.fn().mockResolvedValue({
      count: 1,
      rows: [{ id: 'log-1', action: 'UPDATE', entityType: 'Patient' }],
    });
  });

  test('returns paginated activity logs for admin', async () => {
    const res = await request(app)
      .get('/api/activity-logs?page=1&limit=10&action=UPDATE')
      .set('Authorization', 'Bearer admin-token');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.logs).toHaveLength(1);
  });
});
