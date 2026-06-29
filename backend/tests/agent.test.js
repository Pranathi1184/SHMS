const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');
const { generateAccessToken } = require('../src/utils/jwt');

jest.mock('../src/models');
jest.mock('../src/services/agentService', () => ({
  runSchedulingAgent: jest.fn().mockResolvedValue({ suggestions: '9:00 AM, 10:00 AM' }),
  runFollowUpAgent: jest.fn().mockResolvedValue({ followUpMessages: [] }),
  runInventoryAgent: jest.fn().mockResolvedValue({ recommendations: 'Order more Paracetamol' }),
  runBillingAgent: jest.fn().mockResolvedValue({ billingInsights: 'Total pending: $1000' }),
}));

describe('Agent API', () => {
  let adminToken;
  let doctorToken;

  beforeAll(() => {
    adminToken = generateAccessToken({ id: 'admin1', role: 'Administrator' });
    doctorToken = generateAccessToken({ id: 'doc1', role: 'Doctor' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    db.User.findByPk.mockResolvedValue({ id: 'admin1', role: 'Administrator', isActive: true });
  });

  describe('GET /api/agents/scheduling', () => {
    it('should return 400 for invalid query values', async () => {
      const res = await request(app)
        .get('/api/agents/scheduling?doctorId=invalid&date=not-a-date')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toEqual('error');
    });

    it('should return suggestions from agent', async () => {
      const res = await request(app)
        .get('/api/agents/scheduling?doctorId=550e8400-e29b-41d4-a716-446655440000&date=2026-06-25')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.suggestions).toEqual('9:00 AM, 10:00 AM');
    });

    it('should allow doctor role for scheduling endpoint', async () => {
      db.User.findByPk.mockResolvedValue({ id: 'doc1', role: 'Doctor', isActive: true });
      const res = await request(app)
        .get('/api/agents/scheduling?doctorId=550e8400-e29b-41d4-a716-446655440000&date=2026-06-25')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.statusCode).toEqual(200);
    });
  });

  describe('POST /api/agents/inventory/trigger', () => {
    it('should return inventory insights', async () => {
      const res = await request(app)
        .post('/api/agents/inventory/trigger')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.recommendations).toEqual('Order more Paracetamol');
    });
  });
});
