const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');
const { generateAccessToken } = require('../src/utils/jwt');

jest.mock('../src/models');

describe('Patient API', () => {
  let adminToken;

  beforeAll(() => {
    adminToken = generateAccessToken({ id: 'admin1', role: 'Administrator' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the authentication middleware user lookup
    db.User.findByPk.mockResolvedValue({ id: 'admin1', role: 'Administrator', isActive: true });
  });

  describe('GET /api/patients', () => {
    it('should return 401 if no token provided', async () => {
      const res = await request(app).get('/api/patients');
      expect(res.statusCode).toEqual(401);
    });

    it('should return 200 and patients list for authorized user', async () => {
      db.Patient.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [{ id: 'p1', firstName: 'Alice' }]
      });

      const res = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.patients).toHaveLength(1);
    });
  });

  describe('POST /api/patients', () => {
    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      
      expect(res.statusCode).toEqual(400);
    });
  });
});
