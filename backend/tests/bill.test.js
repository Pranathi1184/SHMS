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

describe('Bill API', () => {
  const billingToken = 'billing-token';
  const patientId = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    jest.clearAllMocks();

    db.sequelize.transaction = jest.fn().mockResolvedValue({
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      finished: false,
    });

    db.Patient.findByPk.mockResolvedValue({ id: patientId });
    db.Bill.create.mockResolvedValue({ id: 'bill-1', billNumber: 'B-1001', patientId, totalAmount: 200, paymentStatus: 'Pending' });
    db.BillItem.create.mockResolvedValue({ id: 'bill-item-1' });
    db.Bill.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [{ id: 'bill-1', billNumber: 'B-1001', totalAmount: 200 }],
    });
    db.Bill.findByPk.mockResolvedValue({
      id: 'bill-1',
      billNumber: 'B-1001',
      patientId,
      totalAmount: 200,
      discount: 0,
      taxAmount: 0,
      netAmount: 200,
      paymentStatus: 'Pending',
      toJSON: () => ({ billNumber: 'B-1001', patientId, totalAmount: 200 }),
      update: jest.fn().mockResolvedValue(true),
      destroy: jest.fn().mockResolvedValue(true),
    });
    db.Notification.create.mockResolvedValue({});
    db.AuditLog.create.mockResolvedValue({});
  });

  test('creates a bill', async () => {
    const res = await request(app)
      .post('/api/bills')
      .set('Authorization', `Bearer ${billingToken}`)
      .send({
        patientId,
        billNumber: 'B-1001',
        totalAmount: 200,
        paymentStatus: 'Pending',
        items: [{ description: 'Consultation', quantity: 1, unitPrice: 200 }],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
  });

  test('lists bills', async () => {
    const res = await request(app)
      .get('/api/bills?page=1&limit=10')
      .set('Authorization', `Bearer ${billingToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.bills).toHaveLength(1);
  });

  test('rejects invalid patientId format', async () => {
    const res = await request(app)
      .post('/api/bills')
      .set('Authorization', `Bearer ${billingToken}`)
      .send({
        patientId: '123',
        billNumber: 'B-1002',
        totalAmount: 120,
        paymentStatus: 'Pending',
        items: [{ description: 'Drug', quantity: 1, unitPrice: 120 }],
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
  });
});
