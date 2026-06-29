const logger = require('../utils/logger');
const { randomUUID } = require('crypto');

const requestObservability = (req, res, next) => {
  req.requestId = randomUUID();
  const startedAt = Date.now();

  res.setHeader('x-request-id', req.requestId);

  res.on('finish', () => {
    logger.info('request_completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      userId: req.user?.id || null,
      role: req.user?.role || null,
    });
  });

  next();
};

module.exports = {
  requestObservability,
};
