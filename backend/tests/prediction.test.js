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
    if (token === 'doctor-token') {
      req.user = { id: 'doc-1', role: 'Doctor', isActive: true };
      return next();
    }
    if (token === 'pharmacist-token') {
      req.user = { id: 'pharm-1', role: 'Pharmacist', isActive: true };
      return next();
    }
    if (token === 'nurse-token') {
      req.user = { id: 'nurse-1', role: 'Nurse', isActive: true };
      return next();
    }
    if (token === 'billing-token') {
      req.user = { id: 'bill-1', role: 'Billing Staff', isActive: true };
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

describe('Prediction API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- No-show predictions ---
  describe('GET /api/predictions/no-show', () => {
    it('returns no-show predictions for admin', async () => {
      db.NoShowPrediction.findAll = jest.fn().mockResolvedValue([
        { id: 1, risk_score: 0.8, risk_label: 'High', appointment: { id: 'a1' } },
      ]);

      const res = await request(app)
        .get('/api/predictions/no-show')
        .set('Authorization', 'Bearer admin-token');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    it('filters by riskLabel', async () => {
      db.NoShowPrediction.findAll = jest.fn().mockResolvedValue([]);

      const res = await request(app)
        .get('/api/predictions/no-show?riskLabel=High')
        .set('Authorization', 'Bearer admin-token');

      expect(res.statusCode).toBe(200);
      expect(db.NoShowPrediction.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { risk_label: 'High' },
        })
      );
    });

    it('returns 403 for Patient role', async () => {
      const res = await request(app)
        .get('/api/predictions/no-show')
        .set('Authorization', 'Bearer patient-token');

      expect(res.statusCode).toBe(403);
    });

    it('returns 500 on DB error', async () => {
      db.NoShowPrediction.findAll = jest.fn().mockRejectedValue(new Error('DB down'));

      const res = await request(app)
        .get('/api/predictions/no-show')
        .set('Authorization', 'Bearer admin-token');

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // --- Doctor load forecasts ---
  describe('GET /api/predictions/doctor-load', () => {
    it('returns doctor load forecasts', async () => {
      db.DoctorLoadForecast.findAll = jest.fn().mockResolvedValue([
        { id: 1, predicted_appointments: 12, doctor: { id: 'd1' } },
      ]);

      const res = await request(app)
        .get('/api/predictions/doctor-load')
        .set('Authorization', 'Bearer admin-token');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
    });

    it('filters by doctorId', async () => {
      db.DoctorLoadForecast.findAll = jest.fn().mockResolvedValue([]);

      await request(app)
        .get('/api/predictions/doctor-load?doctorId=5')
        .set('Authorization', 'Bearer doctor-token');

      expect(db.DoctorLoadForecast.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { doctor_id: 5 },
        })
      );
    });

    it('returns 500 on DB error', async () => {
      db.DoctorLoadForecast.findAll = jest.fn().mockRejectedValue(new Error('fail'));

      const res = await request(app)
        .get('/api/predictions/doctor-load')
        .set('Authorization', 'Bearer admin-token');

      expect(res.statusCode).toBe(500);
    });
  });

  // --- Medicine demand forecasts ---
  describe('GET /api/predictions/medicine-demand', () => {
    it('returns medicine demand forecasts', async () => {
      db.MedicineDemandForecast.findAll = jest.fn().mockResolvedValue([
        { id: 1, predicted_quantity: 500, medicine_name: 'Aspirin' },
      ]);

      const res = await request(app)
        .get('/api/predictions/medicine-demand')
        .set('Authorization', 'Bearer pharmacist-token');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('filters by month', async () => {
      db.MedicineDemandForecast.findAll = jest.fn().mockResolvedValue([]);

      await request(app)
        .get('/api/predictions/medicine-demand?month=2026-07')
        .set('Authorization', 'Bearer admin-token');

      expect(db.MedicineDemandForecast.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ month: '2026-07' }),
        })
      );
    });

    it('returns 500 on DB error', async () => {
      db.MedicineDemandForecast.findAll = jest.fn().mockRejectedValue(new Error('fail'));

      const res = await request(app)
        .get('/api/predictions/medicine-demand')
        .set('Authorization', 'Bearer admin-token');

      expect(res.statusCode).toBe(500);
    });
  });

  // --- Bed occupancy forecasts ---
  describe('GET /api/predictions/bed-occupancy', () => {
    it('returns bed occupancy forecasts', async () => {
      db.BedOccupancyForecast.findAll = jest.fn().mockResolvedValue([
        { id: 1, predicted_occupancy_rate: 78, ward_type: 'General' },
      ]);

      const res = await request(app)
        .get('/api/predictions/bed-occupancy')
        .set('Authorization', 'Bearer nurse-token');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('filters by wardType', async () => {
      db.BedOccupancyForecast.findAll = jest.fn().mockResolvedValue([]);

      await request(app)
        .get('/api/predictions/bed-occupancy?wardType=ICU')
        .set('Authorization', 'Bearer admin-token');

      expect(db.BedOccupancyForecast.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ward_type: 'ICU' },
        })
      );
    });

    it('returns 500 on DB error', async () => {
      db.BedOccupancyForecast.findAll = jest.fn().mockRejectedValue(new Error('fail'));

      const res = await request(app)
        .get('/api/predictions/bed-occupancy')
        .set('Authorization', 'Bearer admin-token');

      expect(res.statusCode).toBe(500);
    });
  });

  // --- Billing risk scores ---
  describe('GET /api/predictions/billing-risk', () => {
    it('returns billing risk scores', async () => {
      db.BillingRiskScore.findAll = jest.fn().mockResolvedValue([
        { id: 1, risk_score: 0.9, risk_label: 'High', bill: { id: 'b1' } },
      ]);

      const res = await request(app)
        .get('/api/predictions/billing-risk')
        .set('Authorization', 'Bearer billing-token');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('filters by riskLabel', async () => {
      db.BillingRiskScore.findAll = jest.fn().mockResolvedValue([]);

      await request(app)
        .get('/api/predictions/billing-risk?riskLabel=Low')
        .set('Authorization', 'Bearer admin-token');

      expect(db.BillingRiskScore.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { risk_label: 'Low' },
        })
      );
    });

    it('returns 500 on DB error', async () => {
      db.BillingRiskScore.findAll = jest.fn().mockRejectedValue(new Error('fail'));

      const res = await request(app)
        .get('/api/predictions/billing-risk')
        .set('Authorization', 'Bearer admin-token');

      expect(res.statusCode).toBe(500);
    });
  });

  // --- Prediction summary ---
  describe('GET /api/predictions/summary', () => {
    it('returns prediction summary for admin', async () => {
      db.NoShowPrediction.count = jest.fn().mockResolvedValue(3);
      db.DoctorLoadForecast.count = jest.fn().mockResolvedValue(2);
      db.MedicineDemandForecast.count = jest.fn().mockResolvedValue(5);
      db.BedOccupancyForecast.count = jest.fn().mockResolvedValue(1);
      db.BillingRiskScore.count = jest.fn().mockResolvedValue(4);

      const res = await request(app)
        .get('/api/predictions/summary')
        .set('Authorization', 'Bearer admin-token');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary).toEqual({
        no_show_high_risk: 3,
        doctor_high_load: 2,
        medicine_urgent: 5,
        occupancy_high: 1,
        billing_high_risk: 4,
      });
    });

    it('returns 403 for non-admin roles', async () => {
      const res = await request(app)
        .get('/api/predictions/summary')
        .set('Authorization', 'Bearer doctor-token');

      expect(res.statusCode).toBe(403);
    });

    it('returns 500 on DB error', async () => {
      db.NoShowPrediction.count = jest.fn().mockRejectedValue(new Error('fail'));

      const res = await request(app)
        .get('/api/predictions/summary')
        .set('Authorization', 'Bearer admin-token');

      expect(res.statusCode).toBe(500);
    });
  });
});
