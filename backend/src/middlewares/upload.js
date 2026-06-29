const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_FILE_SIZE || 10 * 1024 * 1024),
  },
});

module.exports = {
  uploadSingleDocument: upload.single('document'),
};
