describe('JWT utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, JWT_SECRET: 'test-jwt-secret' };
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_EXPIRES_IN;
    delete process.env.JWT_REFRESH_EXPIRES_IN;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('generates and verifies an access token', () => {
    const { generateAccessToken, verifyAccessToken } = require('../src/utils/jwt');
    const payload = { id: 'u1', role: 'Doctor' };
    const token = generateAccessToken(payload);
    const decoded = verifyAccessToken(token);
    expect(decoded.id).toBe('u1');
    expect(decoded.role).toBe('Doctor');
  });

  it('generates and verifies a refresh token', () => {
    const { generateRefreshToken, verifyRefreshToken } = require('../src/utils/jwt');
    const payload = { id: 'u2' };
    const token = generateRefreshToken(payload);
    const decoded = verifyRefreshToken(token);
    expect(decoded.id).toBe('u2');
  });

  it('throws on invalid access token', () => {
    const { verifyAccessToken } = require('../src/utils/jwt');
    expect(() => verifyAccessToken('bad-token')).toThrow();
  });

  it('throws on invalid refresh token', () => {
    const { verifyRefreshToken } = require('../src/utils/jwt');
    expect(() => verifyRefreshToken('bad-token')).toThrow();
  });

  it('throws when JWT_SECRET is not configured', () => {
    delete process.env.JWT_SECRET;
    const { generateAccessToken } = require('../src/utils/jwt');
    expect(() => generateAccessToken({ id: 'x' })).toThrow('JWT_SECRET is not configured');
  });

  it('uses JWT_REFRESH_SECRET when available', () => {
    process.env.JWT_REFRESH_SECRET = 'dedicated-refresh-secret';
    const { generateRefreshToken, verifyRefreshToken } = require('../src/utils/jwt');
    const token = generateRefreshToken({ id: 'u3' });
    const decoded = verifyRefreshToken(token);
    expect(decoded.id).toBe('u3');
  });

  it('falls back to JWT_SECRET for refresh in non-production', () => {
    delete process.env.JWT_REFRESH_SECRET;
    process.env.NODE_ENV = 'development';
    const { generateRefreshToken, verifyRefreshToken } = require('../src/utils/jwt');
    const token = generateRefreshToken({ id: 'u4' });
    const decoded = verifyRefreshToken(token);
    expect(decoded.id).toBe('u4');
  });

  it('throws when JWT_REFRESH_SECRET is missing in production', () => {
    delete process.env.JWT_REFRESH_SECRET;
    process.env.NODE_ENV = 'production';
    const { generateRefreshToken } = require('../src/utils/jwt');
    expect(() => generateRefreshToken({ id: 'u5' })).toThrow('JWT_REFRESH_SECRET is required in production');
  });

  it('throws when both JWT_REFRESH_SECRET and JWT_SECRET are missing in non-production', () => {
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'development';
    const { generateRefreshToken } = require('../src/utils/jwt');
    expect(() => generateRefreshToken({ id: 'u6' })).toThrow(
      'JWT_REFRESH_SECRET is not configured and JWT_SECRET is unavailable for non-production fallback'
    );
  });
});
