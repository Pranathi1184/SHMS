const request = require('supertest');
const db = require('../src/models');
const { generateAccessToken } = require('../src/utils/jwt');

jest.mock('../src/models');
jest.mock('../src/middlewares/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 'ph1', role: 'Pharmacist', isActive: true };
    next();
  },
  authorizeRoles: (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'error', message: 'Forbidden - Insufficient permissions' });
    }
    return next();
  },
}));

const app = require('../src/app');

describe('Medicine FEFO Sales API', () => {
  let pharmacistToken;

  beforeAll(() => {
    pharmacistToken = generateAccessToken({ id: 'ph1', role: 'Pharmacist' });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    db.User.findByPk.mockResolvedValue({ id: 'ph1', role: 'Pharmacist', isActive: true });

    db.sequelize = {
      transaction: jest.fn().mockResolvedValue({
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
      }),
    };

    db.Patient.findByPk.mockResolvedValue({ id: 'p1' });
    db.Medicine.findAll.mockResolvedValue([
      {
        id: 'm-old',
        name: 'Paracetamol',
        batchNumber: 'B1',
        expiryDate: '2026-07-01',
        quantity: 5,
        unitPrice: 2,
        update: jest.fn().mockResolvedValue(undefined),
      },
      {
        id: 'm-new',
        name: 'Paracetamol',
        batchNumber: 'B2',
        expiryDate: '2026-10-01',
        quantity: 10,
        unitPrice: 2,
        update: jest.fn().mockResolvedValue(undefined),
      },
    ]);

    db.Bill.create.mockResolvedValue({ id: 'bill1', billNumber: 'PHARM-1' });
    db.BillItem.bulkCreate.mockResolvedValue([]);
  });

  it('creates a FEFO sale and bill', async () => {
    const res = await request(app)
      .post('/api/medicines/sales')
      .set('Authorization', `Bearer ${pharmacistToken}`)
      .send({
        patientId: '550e8400-e29b-41d4-a716-446655440000',
        items: [{ name: 'Paracetamol', quantity: 6 }],
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.status).toEqual('success');
    expect(res.body.data.lines.length).toBeGreaterThan(0);
  });
});
