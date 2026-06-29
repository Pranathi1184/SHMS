const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');
const { generateAccessToken } = require('../src/utils/jwt');

jest.mock('../src/models');

describe('Doctor API', () => {
  let adminToken;

  beforeAll(() => {
    adminToken = generateAccessToken({ id: 'admin-1', role: 'Administrator' });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    db.User.findByPk.mockResolvedValue({
      id: 'admin-1',
      role: 'Administrator',
      isActive: true,
    });

    db.sequelize.transaction = jest.fn().mockResolvedValue({
      commit: jest.fn(),
      rollback: jest.fn(),
    });
  });

  describe('GET /api/doctors', () => {
    it('returns doctors list for authorized role', async () => {
      db.Doctor.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [
          {
            id: 'doctor-1',
            specialization: 'Cardiology',
            user: { firstName: 'Asha', lastName: 'Rao', email: 'asha@example.com' },
          },
        ],
      });

      const res = await request(app)
        .get('/api/doctors?search=asha')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.doctors).toHaveLength(1);
      expect(res.body.data.filters.search).toBe('asha');
    });
  });

  describe('POST /api/doctors', () => {
    it('returns 400 when license number already exists', async () => {
      const transaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      db.sequelize.transaction.mockResolvedValue(transaction);
      db.User.findOne.mockResolvedValueOnce(null);
      db.Doctor.findOne.mockResolvedValue({ id: 'existing-doctor' });

      const res = await request(app)
        .post('/api/doctors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Ravi',
          lastName: 'Kumar',
          email: 'ravi.kumar@example.com',
          phone: '555-200-3000',
          departmentId: 'department-1',
          specialization: 'Neurology',
          licenseNumber: 'LIC-NEU-001',
          consultationFee: 500,
          password: 'password123',
          availableFrom: '09:00',
          availableTo: '17:00',
          slotDurationMinutes: 30,
          availableDays: [1, 2, 3, 4, 5],
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('License number already exists');
      expect(transaction.rollback).toHaveBeenCalledTimes(1);
    });

    it('returns 400 for invalid availability time range', async () => {
      const res = await request(app)
        .post('/api/doctors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Meera',
          lastName: 'Iyer',
          email: 'meera.iyer@example.com',
          phone: '555-999-1000',
          departmentId: 'department-1',
          specialization: 'Dermatology',
          licenseNumber: 'LIC-DERM-001',
          consultationFee: 450,
          password: 'password123',
          availableFrom: '18:00',
          availableTo: '09:00',
          slotDurationMinutes: 20,
          availableDays: [1, 2, 3],
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });
});
