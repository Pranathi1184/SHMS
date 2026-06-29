const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');

jest.mock('../src/models');
jest.mock('../src/middlewares/auth', () => ({
  authenticateToken: (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token === 'user-token') {
      req.user = { id: 'user-1', role: 'Doctor', isActive: true };
      return next();
    }
    return res.status(401).json({ status: 'error', message: 'Access token is required' });
  },
  authorizeRoles: () => (req, res, next) => next(),
}));

describe('Notification API', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    db.Notification.findAll = jest.fn().mockResolvedValue([{ id: 'n1', read: false, type: 'System' }]);
    db.Notification.count = jest.fn().mockResolvedValue(1);
    db.Notification.findOne = jest.fn().mockResolvedValue({ id: 'n1', read: false, update: jest.fn().mockResolvedValue(true) });
    db.Notification.update = jest.fn().mockResolvedValue([1]);
  });

  test('gets my notifications', async () => {
    const res = await request(app)
      .get('/api/notifications?limit=10')
      .set('Authorization', 'Bearer user-token');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.unreadCount).toBe(1);
  });

  test('marks one notification as read', async () => {
    const res = await request(app)
      .patch('/api/notifications/n1/read')
      .set('Authorization', 'Bearer user-token');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Notification marked as read');
  });

  test('marks all notifications as read', async () => {
    const res = await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', 'Bearer user-token');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('All notifications marked as read');
  });
});
