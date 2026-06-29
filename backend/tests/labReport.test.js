const request = require('supertest');
const db = require('../src/models');
const { generateAccessToken } = require('../src/utils/jwt');

jest.mock('../src/models');
jest.mock('../src/middlewares/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 'd1', role: 'Doctor', isActive: true };
    next();
  },
  authorizeRoles: (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'error', message: 'Forbidden - Insufficient permissions' });
    }
    return next();
  },
}));
jest.mock('../src/services/aiService', () => ({
  generateMedicalReport: jest.fn().mockResolvedValue('Professional lab report'),
}));

const app = require('../src/app');

describe('Laboratory Report API', () => {
  let doctorToken;

  beforeAll(() => {
    doctorToken = generateAccessToken({ id: 'd1', role: 'Doctor' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    db.User.findByPk.mockResolvedValue({ id: 'd1', role: 'Doctor', isActive: true });
    db.LaboratoryTest.findByPk.mockResolvedValue({
      id: 'lt1',
      testName: 'CBC',
      status: 'Completed',
      orderDate: new Date(),
      resultDate: new Date(),
      results: { hemoglobin: '13.2' },
      notes: 'Stable',
      patient: { firstName: 'John', lastName: 'Doe' },
      doctor: { user: { firstName: 'Priya', lastName: 'Rao' } },
    });
  });

  it('generates professional lab report text', async () => {
    const res = await request(app)
      .get('/api/laboratory-tests/550e8400-e29b-41d4-a716-446655440000/report')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.report).toEqual('Professional lab report');
  });
});
