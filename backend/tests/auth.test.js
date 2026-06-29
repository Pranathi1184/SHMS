const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');

// Mock Sequelize models
jest.mock('../src/models');

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should return 400 if validation fails', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid' });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toEqual('error');
    });

    it('should return 201 on successful registration', async () => {
      db.User.findOne.mockResolvedValue(null);
      db.User.create.mockResolvedValue({
        id: '123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'Patient',
        toJSON: () => ({ id: '123', email: 'john@example.com' })
      });
      db.Patient.findOne.mockResolvedValue(null);
      db.Patient.create.mockResolvedValue({ id: 'p-1' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'Patient',
          phone: '555-123-1111',
          dateOfBirth: '1990-01-01',
          gender: 'Male'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('should reject privileged role registration from public endpoint', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Admin',
          lastName: 'User',
          email: 'newadmin@example.com',
          password: 'password123',
          role: 'Administrator'
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body.status).toEqual('error');
    });

    it('should reject Admin alias registration on public endpoint', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Alias',
          lastName: 'Case',
          email: 'alias@example.com',
          password: 'password123',
          role: 'Admin'
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body.status).toEqual('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 401 for invalid credentials', async () => {
      db.User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'password'
        });

      expect(res.statusCode).toEqual(401);
    });
  });
});
