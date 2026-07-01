const { hashPassword, comparePassword } = require('../src/utils/password');

describe('Password utilities', () => {
  it('hashes a password and verifies it with comparePassword', async () => {
    const raw = 'SecurePass123';
    const hashed = await hashPassword(raw);
    expect(hashed).not.toBe(raw);
    expect(typeof hashed).toBe('string');

    const match = await comparePassword(raw, hashed);
    expect(match).toBe(true);
  });

  it('returns false for mismatched password', async () => {
    const hashed = await hashPassword('correct');
    const match = await comparePassword('wrong', hashed);
    expect(match).toBe(false);
  });
});
