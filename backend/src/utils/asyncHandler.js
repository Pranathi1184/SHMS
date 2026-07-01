const logger = require('./logger');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return res.status(error.statusCode).json({ status: 'error', message: error.message });
    }
    logger.error(`${req.method} ${req.originalUrl} error:`, error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  });
};

module.exports = asyncHandler;
