const crypto = require('crypto');
const logger = require('../utils/logger');

const idempotencyStore = new Map();

const STORE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Cleanup expired entries periodically (unref to not prevent process exit)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of idempotencyStore) {
    if (now - entry.timestamp > STORE_TTL_MS) {
      idempotencyStore.delete(key);
    }
  }
}, 60 * 60 * 1000).unref();

const idempotencyCheck = (req, res, next) => {
  const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];

  if (!idempotencyKey) {
    return next();
  }

  // req.user is set by authenticateToken middleware which runs before this
  const userId = req.user?.id;
  if (!userId) {
    // Skip idempotency for unauthenticated requests to prevent cross-user leakage
    return next();
  }

  const storeKey = `${userId}:${idempotencyKey}`;

  const existing = idempotencyStore.get(storeKey);
  if (existing) {
    logger.info('Idempotent request detected, returning cached response', {
      idempotencyKey,
      userId,
    });
    return res.status(existing.statusCode).json(existing.body);
  }

  // Capture the original json method to store the response
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyStore.set(storeKey, {
        statusCode: res.statusCode,
        body,
        timestamp: Date.now(),
      });
    }
    return originalJson(body);
  };

  next();
};

module.exports = { idempotencyCheck };
