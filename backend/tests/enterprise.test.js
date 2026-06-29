const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');

jest.mock('../src/models');
jest.mock('../src/services/notificationService', () => ({
  createNotification: jest.fn().mockResolvedValue(true),
}));
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

describe('Enterprise API', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    db.Claim.create = jest.fn().mockResolvedValue({ id: 'claim-1' });
    db.Claim.findAll = jest.fn().mockResolvedValue([{ id: 'claim-1' }]);
    db.Claim.findByPk = jest.fn().mockResolvedValue({ id: 'claim-1', update: jest.fn().mockResolvedValue(true) });

    db.DischargePathway.findOne = jest.fn().mockResolvedValue(null);
    db.DischargePathway.create = jest.fn().mockResolvedValue({ id: 'dp-1', status: 'In Progress' });
    db.DischargePathway.findAll = jest.fn().mockResolvedValue([{ id: 'dp-1' }]);

    db.Patient.findByPk = jest.fn().mockResolvedValue({ id: 'patient-1', firstName: 'Ria', lastName: 'Shah' });
    db.CommunicationLog.create = jest.fn().mockResolvedValue({ id: 'comm-1' });
    db.CommunicationLog.findAll = jest.fn().mockResolvedValue([{ id: 'comm-1' }]);
  });

  test('creates a claim', async () => {
    const res = await request(app)
      .post('/api/enterprise/claims')
      .set('Authorization', 'Bearer admin-token')
      .send({ patientId: 'p1', billId: 'b1', insuranceId: 'i1', amount: 1000, status: 'Draft' });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
  });

  test('creates discharge pathway', async () => {
    const res = await request(app)
      .post('/api/enterprise/discharge-pathways')
      .set('Authorization', 'Bearer admin-token')
      .send({ admissionId: 'adm-1', checklist: { meds: true }, status: 'In Progress' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
  });

  test('sends patient communication', async () => {
    const res = await request(app)
      .post('/api/enterprise/communications/send')
      .set('Authorization', 'Bearer admin-token')
      .send({
        patientId: 'patient-1',
        channel: 'Email',
        category: 'Discharge',
        subject: 'Discharge Plan',
        content: 'Please follow instructions.',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
  });
});
