const request = require('supertest');
const db = require('../src/models');
const { generateAccessToken } = require('../src/utils/jwt');

jest.mock('../src/models');
jest.mock('../src/middlewares/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 'admin1', role: 'Administrator', isActive: true };
    next();
  },
  authorizeRoles: (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'error', message: 'Forbidden - Insufficient permissions' });
    }
    return next();
  },
}));
jest.mock('../src/services/storageService', () => ({
  uploadPatientDocumentBuffer: jest.fn().mockResolvedValue({
    storageProvider: 'Local',
    storageKey: 'patient-documents/p1/doc.txt',
    bucketName: null,
    fileUrl: '/uploads/patient-documents/p1/doc.txt',
  }),
}));

const app = require('../src/app');

describe('Patient Documents API', () => {
  let adminToken;

  beforeAll(() => {
    adminToken = generateAccessToken({ id: 'admin1', role: 'Administrator' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    db.User.findByPk.mockResolvedValue({ id: 'admin1', role: 'Administrator', isActive: true });
    db.Patient.findByPk.mockResolvedValue({ id: 'p1' });
    db.PatientDocument.create.mockResolvedValue({ id: 'doc1', fileUrl: '/uploads/patient-documents/p1/doc.txt' });
    db.PatientDocument.findAll.mockResolvedValue([{ id: 'doc1' }]);
  });

  it('uploads a patient document', async () => {
    const res = await request(app)
      .post('/api/patients/p1/documents')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('category', 'Report')
      .attach('document', Buffer.from('test report'), 'report.txt');

    expect(res.statusCode).toEqual(201);
    expect(res.body.status).toEqual('success');
  });

  it('lists patient documents', async () => {
    const res = await request(app)
      .get('/api/patients/p1/documents')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.documents).toHaveLength(1);
  });
});
