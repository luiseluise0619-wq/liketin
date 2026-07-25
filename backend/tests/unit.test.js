const { calculateDistance, generateLocationQuery } = require('../src/utils/location');

// Set secrets before requiring jwt util.
process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'test-access';
process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'test-refresh';
const { generateTokens, verifyAccessToken } = require('../src/utils/jwt');
const { registerSchema, swipeSchema } = require('../src/utils/validators');

describe('location utils', () => {
  it('returns ~0 km for identical coordinates', () => {
    expect(calculateDistance(37.5665, 126.978, 37.5665, 126.978)).toBeCloseTo(0, 5);
  });

  it('computes a plausible distance Seoul -> Busan (~325km)', () => {
    const d = calculateDistance(37.5665, 126.978, 35.1796, 129.0756);
    expect(d).toBeGreaterThan(300);
    expect(d).toBeLessThan(360);
  });

  it('builds a bounding box around a point', () => {
    const box = generateLocationQuery(37.5, 127, 50);
    expect(box.latMin).toBeLessThan(37.5);
    expect(box.latMax).toBeGreaterThan(37.5);
    expect(box.lngMin).toBeLessThan(127);
    expect(box.lngMax).toBeGreaterThan(127);
  });
});

describe('jwt utils', () => {
  it('generates and verifies an access token', () => {
    const { accessToken } = generateTokens({ userId: 'abc', email: 'a@b.com' });
    const decoded = verifyAccessToken(accessToken);
    expect(decoded.userId).toBe('abc');
    expect(decoded.email).toBe('a@b.com');
  });
});

describe('validators', () => {
  it('accepts a valid registration payload', () => {
    const { error } = registerSchema.validate({
      email: 'test@example.com',
      password: 'Password123',
      name: 'Test User',
      birthDate: '1995-01-01',
      gender: 'MALE',
      interestedIn: 'FEMALE',
    });
    expect(error).toBeUndefined();
  });

  it('rejects a weak password', () => {
    const { error } = registerSchema.validate({
      email: 'test@example.com',
      password: 'weak',
      name: 'Test User',
      birthDate: '1995-01-01',
      gender: 'MALE',
      interestedIn: 'FEMALE',
    });
    expect(error).toBeDefined();
  });

  it('rejects an invalid swipe type', () => {
    const { error } = swipeSchema.validate({
      targetUserId: '11111111-1111-1111-1111-111111111111',
      type: 'MAYBE',
    });
    expect(error).toBeDefined();
  });
});
