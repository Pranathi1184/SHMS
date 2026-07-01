const fs = require('fs');
const path = require('path');
const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');

const hasS3Config = () => Boolean(process.env.AWS_REGION && process.env.AWS_S3_BUCKET);

const sanitizeFileName = (name) => String(name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');

const ensureDir = async (dirPath) => {
  await fs.promises.mkdir(dirPath, { recursive: true });
};

const uploadToLocal = async ({ buffer, key }) => {
  const root = process.env.LOCAL_UPLOAD_DIR || path.join(process.cwd(), 'uploads');
  const filePath = path.join(root, key);
  await ensureDir(path.dirname(filePath));
  await fs.promises.writeFile(filePath, buffer);

  return {
    storageProvider: 'Local',
    storageKey: key,
    bucketName: null,
    fileUrl: `/uploads/${key}`.replace(/\\/g, '/'),
  };
};

const uploadToS3 = async ({ buffer, key, contentType }) => {
  const client = new S3Client({ region: process.env.AWS_REGION });
  const bucket = process.env.AWS_S3_BUCKET;

  try {
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }));
  } catch (error) {
    const wrapped = new Error(`S3 upload failed for key "${key}": ${error.message}`);
    wrapped.cause = error;
    throw wrapped;
  }

  return {
    storageProvider: 'S3',
    storageKey: key,
    bucketName: bucket,
    fileUrl: `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${encodeURIComponent(key).replace(/%2F/g, '/')}`,
  };
};

const uploadPatientDocumentBuffer = async ({ patientId, originalName, mimeType, buffer }) => {
  const stamp = Date.now();
  const safe = sanitizeFileName(originalName);
  const key = `patient-documents/${patientId}/${stamp}-${safe}`;

  if (hasS3Config()) {
    return uploadToS3({ buffer, key, contentType: mimeType });
  }

  return uploadToLocal({ buffer, key });
};

module.exports = {
  uploadPatientDocumentBuffer,
};
