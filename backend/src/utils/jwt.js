const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const getAccessSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
};

const getRefreshSecret = () => {
  if (process.env.JWT_REFRESH_SECRET) {
    return process.env.JWT_REFRESH_SECRET;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_REFRESH_SECRET is required in production');
  }

  const accessSecret = process.env.JWT_SECRET;
  if (!accessSecret) {
    throw new Error('JWT_REFRESH_SECRET is not configured and JWT_SECRET is unavailable for non-production fallback');
  }

  return accessSecret;
};

const generateAccessToken = (payload) => {
  return jwt.sign(payload, getAccessSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, getRefreshSecret(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, getAccessSecret());
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, getRefreshSecret());
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
