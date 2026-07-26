process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'test-access';
process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'test-refresh';

// Prevent tokenService from opening a real Redis connection at import time;
// the tests inject their own in-memory store into TokenService.
jest.mock('../src/config/redis', () => ({}));

const { TokenService } = require('../src/services/tokenService');

// Minimal in-memory Redis stand-in supporting the calls TokenService makes.
class FakeStore {
  constructor() {
    this.map = new Map();
  }

  async set(key, value) {
    this.map.set(key, value);
    return 'OK';
  }

  async get(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }

  async del(...keys) {
    let n = 0;
    for (const k of keys) if (this.map.delete(k)) n++;
    return n;
  }

  async keys(pattern) {
    const prefix = pattern.replace(/\*$/, '');
    return [...this.map.keys()].filter((k) => k.startsWith(prefix));
  }
}

describe('TokenService', () => {
  let store;
  let service;

  beforeEach(() => {
    store = new FakeStore();
    service = new TokenService(store);
  });

  it('issues an access + refresh token and stores the jti', async () => {
    const tokens = await service.issue({ userId: 'u1', email: 'a@b.com' });
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(store.map.size).toBe(1);
  });

  it('rotates a refresh token and invalidates the old one', async () => {
    const { refreshToken } = await service.issue({ userId: 'u1', email: 'a@b.com' });
    const rotated = await service.rotate(refreshToken);
    expect(rotated.refreshToken).toBeDefined();
    expect(rotated.refreshToken).not.toBe(refreshToken);

    // The original token is now single-use-consumed → reuse must be rejected.
    await expect(service.rotate(refreshToken)).rejects.toThrow('Refresh token revoked');
  });

  it('rejects a revoked (logged-out) refresh token', async () => {
    const { refreshToken } = await service.issue({ userId: 'u1', email: 'a@b.com' });
    await service.revoke(refreshToken);
    await expect(service.rotate(refreshToken)).rejects.toThrow('Refresh token revoked');
  });

  it('revokeAll clears every refresh token for a user', async () => {
    await service.issue({ userId: 'u1', email: 'a@b.com' });
    await service.issue({ userId: 'u1', email: 'a@b.com' });
    await service.issue({ userId: 'u2', email: 'c@d.com' });
    expect(store.map.size).toBe(3);

    await service.revokeAll('u1');
    const remaining = [...store.map.keys()];
    expect(remaining).toHaveLength(1);
    expect(remaining[0]).toContain('u2');
  });
});
