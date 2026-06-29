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

describe('Analytics API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.sequelize = {
      query: jest.fn(),
      fn: jest.fn(() => 'COUNT'),
      col: jest.fn(() => 'id'),
      literal: jest.fn(() => 'COUNT(id) > 1'),
    };

    db.Patient.findAll = jest.fn().mockResolvedValue([]);
    db.Patient.count = jest.fn().mockResolvedValue(2);
    db.Appointment.count = jest.fn().mockResolvedValue(0);
  });

  test('returns analytics summary', async () => {
    db.sequelize.query
      .mockResolvedValueOnce([{ date: '2026-06-01', totalRevenue: 1000, totalBills: 2 }])
      .mockResolvedValueOnce([{ date: '2026-06-01', newPatients: 3, totalAppointments: 5 }])
      .mockResolvedValueOnce([{ month: '2026-06', medicineName: 'Paracetamol', predictedQuantity: 50 }])
      .mockResolvedValueOnce([{ date: '2026-06-02', predictedOccupancyRate: 80, wardType: 'ICU' }]);

    const res = await request(app)
      .get('/api/analytics/summary')
      .set('Authorization', 'Bearer admin-token');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.revenue.summary.totalRevenue).toBe(1000);
  });

  test('rejects unsupported KPI metric', async () => {
    const res = await request(app)
      .get('/api/analytics/kpi-drilldown?metric=unknown')
      .set('Authorization', 'Bearer admin-token');

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Unsupported KPI metric');
  });

  test('runs data quality checks', async () => {
    const res = await request(app)
      .post('/api/analytics/data-quality/run')
      .set('Authorization', 'Bearer admin-token');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.missingPatientPhones).toBe(2);
  });
});
