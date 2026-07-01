const multer = require('multer');
const path = require('path');

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx', '.txt',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_FILE_SIZE || 10 * 1024 * 1024),
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIME_TYPES.has(file.mimetype) && ALLOWED_EXTENSIONS.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Accepted: PDF, JPEG, PNG, GIF, DOC, DOCX, TXT'));
    }
  },
});

module.exports = {
  uploadSingleDocument: upload.single('document'),
};
