const crypto = require('crypto');
const { verifyAccessToken } = require('../utils/jwt');
const db = require('../models');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Access token is required' });
  }

  try {
    const decoded = verifyAccessToken(token);

    // Check token blacklist using SHA-256 hash
    if (db.TokenBlacklist) {
      const tokenHash = hashToken(token);
      const blacklisted = await db.TokenBlacklist.findOne({ where: { tokenHash } });
      if (blacklisted) {
        return res.status(401).json({ status: 'error', message: 'Token has been revoked' });
      }
    }

    const user = await db.User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    return res.status(403).json({ status: 'error', message: 'Invalid or expired token' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'error', message: 'Forbidden - Insufficient permissions' });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
};
