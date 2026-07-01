const fs = require('fs');
const path = require('path');

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: jest.fn(),
}));

describe('storageService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.AWS_REGION;
    delete process.env.AWS_S3_BUCKET;
    delete process.env.LOCAL_UPLOAD_DIR;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  afterAll(async () => {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'patient-documents');
    try {
      await fs.promises.rm(uploadsDir, { recursive: true, force: true });
    } catch (_) {}
  });

  it('uploads to local filesystem when no S3 config', async () => {
    const { uploadPatientDocumentBuffer } = require('../src/services/storageService');

    const result = await uploadPatientDocumentBuffer({
      patientId: 'p-123',
      originalName: 'scan report.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('test-content'),
    });

    expect(result.storageProvider).toBe('Local');
    expect(result.storageKey).toMatch(/^patient-documents\/p-123\/\d+-scan_report\.pdf$/);
    expect(result.bucketName).toBeNull();
    expect(result.fileUrl).toMatch(/^\/uploads\/patient-documents\/p-123\//);

    const filePath = path.join(process.cwd(), result.fileUrl.replace(/^\//, ''));
    const contents = await fs.promises.readFile(filePath, 'utf-8');
    expect(contents).toBe('test-content');
  });

  it('uploads to S3 when AWS config is present', async () => {
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_S3_BUCKET = 'my-bucket';

    const { uploadPatientDocumentBuffer } = require('../src/services/storageService');

    const result = await uploadPatientDocumentBuffer({
      patientId: 'p-456',
      originalName: 'x-ray.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('img-data'),
    });

    expect(result.storageProvider).toBe('S3');
    expect(result.storageKey).toMatch(/^patient-documents\/p-456\/\d+-x-ray\.jpg$/);
    expect(result.bucketName).toBe('my-bucket');
    expect(result.fileUrl).toContain('my-bucket.s3.us-east-1.amazonaws.com');
  });

  it('sanitizes special characters in file names', async () => {
    const { uploadPatientDocumentBuffer } = require('../src/services/storageService');

    const result = await uploadPatientDocumentBuffer({
      patientId: 'p-789',
      originalName: 'my file (1)!@#$.doc',
      mimeType: 'application/msword',
      buffer: Buffer.from('data'),
    });

    expect(result.storageKey).not.toMatch(/[^a-zA-Z0-9._\-/]/);
  });

  it('uses LOCAL_UPLOAD_DIR env var when set', async () => {
    const tmpDir = path.join(process.cwd(), 'test-uploads-tmp');
    process.env.LOCAL_UPLOAD_DIR = tmpDir;

    const { uploadPatientDocumentBuffer } = require('../src/services/storageService');

    const result = await uploadPatientDocumentBuffer({
      patientId: 'p-env',
      originalName: 'file.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('hello'),
    });

    expect(result.storageProvider).toBe('Local');
    const filePath = path.join(tmpDir, result.storageKey);
    const contents = await fs.promises.readFile(filePath, 'utf-8');
    expect(contents).toBe('hello');

    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });
});
