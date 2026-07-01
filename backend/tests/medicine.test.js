const request = require('supertest');
const db = require('../src/models');
const { generateAccessToken } = require('../src/utils/jwt');

jest.mock('../src/models');
jest.mock('../src/middlewares/auth', () => ({
  authenticateToken: (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token === 'admin-token') {
      req.user = { id: 'admin-1', role: 'Administrator', isActive: true };
      return next();
    }
    if (token === 'pharmacist-token') {
      req.user = { id: 'pharm-1', role: 'Pharmacist', isActive: true };
      return next();
    }
    if (token === 'doctor-token') {
      req.user = { id: 'doc-1', role: 'Doctor', isActive: true };
      return next();
    }
    if (token === 'patient-token') {
      req.user = { id: 'pat-1', role: 'Patient', isActive: true };
      return next();
    }
    return res.status(401).json({ status: 'error', message: 'Access token is required' });
  },
  authorizeRoles: (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'error', message: 'Forbidden - Insufficient permissions' });
    }
    return next();
  },
}));

const app = require('../src/app');

const validMedicine = {
  name: 'Paracetamol',
  dosageForm: 'Tablet',
  strength: '500mg',
  expiryDate: '2027-12-31',
  quantity: 100,
  unitPrice: 2.5,
};

describe('Medicine CRUD API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Create ---
  describe('POST /api/medicines', () => {
    it('creates a medicine (admin)', async () => {
      db.Medicine.create = jest.fn().mockResolvedValue({ id: 'm1', ...validMedicine });

      const res = await request(app)
        .post('/api/medicines')
        .set('Authorization', 'Bearer admin-token')
        .send(validMedicine);

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.name).toBe('Paracetamol');
    });

    it('creates a medicine (pharmacist)', async () => {
      db.Medicine.create = jest.fn().mockResolvedValue({ id: 'm2', ...validMedicine });

      const res = await request(app)
        .post('/api/medicines')
        .set('Authorization', 'Bearer pharmacist-token')
        .send(validMedicine);

      expect(res.statusCode).toBe(201);
    });

    it('returns 403 for unauthorized role', async () => {
      const res = await request(app)
        .post('/api/medicines')
        .set('Authorization', 'Bearer patient-token')
        .send(validMedicine);

      expect(res.statusCode).toBe(403);
    });

    it('returns 400 with validation error for missing name', async () => {
      const res = await request(app)
        .post('/api/medicines')
        .set('Authorization', 'Bearer admin-token')
        .send({ dosageForm: 'Tablet', strength: '500mg', expiryDate: '2027-12-31', quantity: 10, unitPrice: 1 });

      expect(res.statusCode).toBe(400);
    });

    it('returns 500 on DB error', async () => {
      db.Medicine.create = jest.fn().mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/api/medicines')
        .set('Authorization', 'Bearer admin-token')
        .send(validMedicine);

      expect(res.statusCode).toBe(500);
    });
  });

  // --- List ---
  describe('GET /api/medicines', () => {
    it('returns paginated medicine list', async () => {
      db.Medicine.findAndCountAll = jest.fn().mockResolvedValue({
        count: 1,
        rows: [{ id: 'm1', name: 'Aspirin' }],
      });

      const res = await request(app)
        .get('/api/medicines')
        .set('Authorization', 'Bearer doctor-token');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.medicines).toHaveLength(1);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('accepts search query parameter', async () => {
      db.Medicine.findAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] });

      const res = await request(app)
        .get('/api/medicines?search=aspirin')
        .set('Authorization', 'Bearer doctor-token');

      expect(res.statusCode).toBe(200);
    });

    it('returns 500 on DB error', async () => {
      db.Medicine.findAndCountAll = jest.fn().mockRejectedValue(new Error('fail'));

      const res = await request(app)
        .get('/api/medicines')
        .set('Authorization', 'Bearer doctor-token');

      expect(res.statusCode).toBe(500);
    });
  });

  // --- Get by ID ---
  describe('GET /api/medicines/:id', () => {
    it('returns a single medicine', async () => {
      db.Medicine.findByPk = jest.fn().mockResolvedValue({ id: 'm1', name: 'Aspirin' });

      const res = await request(app)
        .get('/api/medicines/m1')
        .set('Authorization', 'Bearer doctor-token');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('Aspirin');
    });

    it('returns 404 when not found', async () => {
      db.Medicine.findByPk = jest.fn().mockResolvedValue(null);

      const res = await request(app)
        .get('/api/medicines/nonexistent')
        .set('Authorization', 'Bearer doctor-token');

      expect(res.statusCode).toBe(404);
    });

    it('returns 500 on DB error', async () => {
      db.Medicine.findByPk = jest.fn().mockRejectedValue(new Error('fail'));

      const res = await request(app)
        .get('/api/medicines/m1')
        .set('Authorization', 'Bearer doctor-token');

      expect(res.statusCode).toBe(500);
    });
  });

  // --- Update ---
  describe('PUT /api/medicines/:id', () => {
    it('updates a medicine', async () => {
      const mockMedicine = {
        id: 'm1',
        name: 'Aspirin',
        update: jest.fn().mockResolvedValue(undefined),
      };
      db.Medicine.findByPk = jest.fn().mockResolvedValue(mockMedicine);

      const res = await request(app)
        .put('/api/medicines/m1')
        .set('Authorization', 'Bearer admin-token')
        .send({ name: 'Aspirin Updated' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(mockMedicine.update).toHaveBeenCalled();
    });

    it('returns 404 when not found', async () => {
      db.Medicine.findByPk = jest.fn().mockResolvedValue(null);

      const res = await request(app)
        .put('/api/medicines/nonexistent')
        .set('Authorization', 'Bearer admin-token')
        .send({ name: 'X' });

      expect(res.statusCode).toBe(404);
    });

    it('returns 500 on DB error', async () => {
      db.Medicine.findByPk = jest.fn().mockRejectedValue(new Error('fail'));

      const res = await request(app)
        .put('/api/medicines/m1')
        .set('Authorization', 'Bearer admin-token')
        .send({ name: 'X' });

      expect(res.statusCode).toBe(500);
    });
  });

  // --- Delete ---
  describe('DELETE /api/medicines/:id', () => {
    it('deletes a medicine (admin only)', async () => {
      const mockMedicine = {
        id: 'm1',
        destroy: jest.fn().mockResolvedValue(undefined),
      };
      db.Medicine.findByPk = jest.fn().mockResolvedValue(mockMedicine);

      const res = await request(app)
        .delete('/api/medicines/m1')
        .set('Authorization', 'Bearer admin-token');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(mockMedicine.destroy).toHaveBeenCalled();
    });

    it('returns 404 when not found', async () => {
      db.Medicine.findByPk = jest.fn().mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/medicines/nonexistent')
        .set('Authorization', 'Bearer admin-token');

      expect(res.statusCode).toBe(404);
    });

    it('returns 403 for pharmacist (admin-only route)', async () => {
      const res = await request(app)
        .delete('/api/medicines/m1')
        .set('Authorization', 'Bearer pharmacist-token');

      expect(res.statusCode).toBe(403);
    });

    it('returns 500 on DB error', async () => {
      db.Medicine.findByPk = jest.fn().mockRejectedValue(new Error('fail'));

      const res = await request(app)
        .delete('/api/medicines/m1')
        .set('Authorization', 'Bearer admin-token');

      expect(res.statusCode).toBe(500);
    });
  });
});
