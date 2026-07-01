const { verifyAccessToken } = require('../utils/jwt');
const db = require('../models');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Access token is required' });
  }

  try {
    const decoded = verifyAccessToken(token);

    // Check token blacklist
    if (db.TokenBlacklist) {
      const blacklisted = await db.TokenBlacklist.findOne({ where: { token } });
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
