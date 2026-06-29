const request = require('supertest');

jest.mock('../src/models');
jest.mock('../src/middlewares/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: '550e8400-e29b-41d4-a716-446655440010', role: 'Doctor', isActive: true };
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
  generatePatientSummary: jest.fn().mockResolvedValue('Mocked Summary'),
  generateMedicalReport: jest.fn().mockResolvedValue('Mocked Report'),
  generateAppointmentReminder: jest.fn().mockResolvedValue('Mocked Reminder'),
  hospitalChatbot: jest.fn().mockResolvedValue('Mocked Chatbot Response'),
}));

const app = require('../src/app');
const db = require('../src/models');

describe('AI API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/ai/patient-summary/:patientId', () => {
    it('should return 400 for invalid patient id format', async () => {
      const res = await request(app)
        .get('/api/ai/patient-summary/invalid-id');

      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toEqual('error');
    });

    it('should return AI summary for valid patient', async () => {
      db.Patient.findByPk.mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440020', firstName: 'Alice' });

      const res = await request(app)
        .get('/api/ai/patient-summary/550e8400-e29b-41d4-a716-446655440020');

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.summary).toEqual('Mocked Summary');
    });
  });

  describe('POST /api/ai/medical-report', () => {
    it('should return 400 for short doctor notes', async () => {
      const res = await request(app)
        .post('/api/ai/medical-report')
        .send({ doctorNotes: 'short' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toEqual('error');
    });

    it('should return generated report', async () => {
      const res = await request(app)
        .post('/api/ai/medical-report')
        .send({ doctorNotes: 'Patient has mild fever with headache since last night.' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.report).toEqual('Mocked Report');
    });
  });

  describe('POST /api/ai/chatbot', () => {
    it('should return chatbot response when patientId is omitted', async () => {
      const res = await request(app)
        .post('/api/ai/chatbot')
        .send({ query: 'What is my latest prescription?' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.response).toEqual('Mocked Chatbot Response');
      expect(db.Patient.findByPk).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid patientId format', async () => {
      const res = await request(app)
        .post('/api/ai/chatbot')
        .send({ query: 'What is my latest prescription?', patientId: 'invalid-id' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toEqual('error');
    });

    it('should return chatbot response for valid payload', async () => {
      db.Patient.findByPk.mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440000', firstName: 'Alice' });

      const res = await request(app)
        .post('/api/ai/chatbot')
        .send({ query: 'When is my next appointment?', patientId: '550e8400-e29b-41d4-a716-446655440000' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.response).toEqual('Mocked Chatbot Response');
    });
  });
});
