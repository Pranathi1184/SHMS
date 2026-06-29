const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');
const { generateAccessToken } = require('../src/utils/jwt');

jest.mock('../src/models');

describe('Report API', () => {
  let adminToken;

  beforeAll(() => {
    adminToken = generateAccessToken({ id: 'admin1', role: 'Administrator' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    db.User.findByPk.mockResolvedValue({ id: 'admin1', role: 'Administrator', isActive: true });
  });

  it('GET /api/reports/revenue returns revenue report', async () => {
    db.Bill.findAll
      .mockResolvedValueOnce([{ date: '2026-06-20', totalRevenue: '100.00', totalBills: '1' }])
      .mockResolvedValueOnce([{ month: '2026-06-01', totalRevenue: '3000.00' }]);

    const res = await request(app)
      .get('/api/reports/revenue')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('success');
    expect(res.body.data).toHaveProperty('dailyRevenue');
    expect(res.body.data).toHaveProperty('monthlyRevenue');
    expect(res.body.data).toHaveProperty('summary');
  });

  it('GET /api/reports/patients returns patient report', async () => {
    db.Patient.count.mockResolvedValueOnce(50).mockResolvedValueOnce(7);
    db.Patient.findAll.mockResolvedValueOnce([{ gender: 'Male', count: '30' }]).mockResolvedValueOnce([{ date: '2026-06-20', count: '4' }]);

    const res = await request(app)
      .get('/api/reports/patients')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.totalPatients).toEqual(50);
    expect(res.body.data).toHaveProperty('patientsCreatedByDate');
  });

  it('GET /api/reports/departments returns department report', async () => {
    db.Department.findAll.mockResolvedValue([
      { id: 'd1', name: 'Cardiology', doctors: [{ id: 'doc1' }] },
    ]);
    db.Appointment.findAll.mockResolvedValue([{ doctorId: 'doc1' }, { doctorId: 'doc1' }]);

    const res = await request(app)
      .get('/api/reports/departments')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.departments[0]).toHaveProperty('appointmentCount');
  });

  it('GET /api/reports/inventory returns inventory report', async () => {
    db.Medicine.findAll.mockResolvedValueOnce([{ id: 'm1', name: 'Paracetamol', quantity: 4, reorderLevel: 20 }]).mockResolvedValueOnce([]);

    const res = await request(app)
      .get('/api/reports/inventory')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.lowStockCount).toEqual(1);
  });

  it('GET /api/reports/occupancy returns occupancy report', async () => {
    db.Bed.findAll.mockResolvedValue([{ status: 'Occupied', count: '5' }]);
    db.Bed.count.mockResolvedValueOnce(10).mockResolvedValueOnce(5).mockResolvedValueOnce(5);
    db.Admission.findAll.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/reports/occupancy')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.occupancyRate).toEqual(50);
    expect(res.body.data).toHaveProperty('bedStatusBreakdown');
  });
});
