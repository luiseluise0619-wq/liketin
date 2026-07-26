const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const redis = require('../config/redis');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

const key = (userId, jti) => `refresh:${userId}:${jti}`;

// Manages access/refresh tokens with server-side refresh invalidation.
// Each refresh token carries a unique jti that must exist in Redis to be
// accepted. Rotation deletes the old jti and issues a new one, so a stolen
// (already-used) refresh token is detected as revoked. The store is injectable
// for testing.
class TokenService {
  constructor(store = redis) {
    this.store = store;
  }

  async issue(payload) {
    const jti = crypto.randomUUID();
    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ ...payload, jti }, REFRESH_TOKEN_SECRET, {
      expiresIn: '7d',
    });
    await this.store.set(key(payload.userId, jti), '1', 'EX', REFRESH_TTL_SECONDS);
    return { accessToken, refreshToken };
  }

  async rotate(refreshToken) {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    const exists = await this.store.get(key(decoded.userId, decoded.jti));
    if (!exists) {
      const err = new Error('Refresh token revoked');
      err.code = 'REFRESH_REVOKED';
      throw err;
    }
    // Single-use: consume the old jti before issuing a replacement.
    await this.store.del(key(decoded.userId, decoded.jti));
    return this.issue({ userId: decoded.userId, email: decoded.email });
  }

  async revoke(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
      await this.store.del(key(decoded.userId, decoded.jti));
    } catch (_) {
      // Already invalid/expired — nothing to revoke.
    }
  }

  async revokeAll(userId) {
    // ioredis exposes keys(); for large deployments use SCAN instead.
    if (typeof this.store.keys === 'function') {
      const keys = await this.store.keys(key(userId, '*'));
      if (keys.length) await this.store.del(...keys);
    }
  }
}

module.exports = new TokenService();
module.exports.TokenService = TokenService;
