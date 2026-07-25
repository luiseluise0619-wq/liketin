const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis = require('../config/redis');

const createRateLimiter = (windowMs, max, keyPrefix) =>
  rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: keyPrefix,
    }),
    windowMs,
    max,
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  });

const authLimiter = createRateLimiter(15 * 60 * 1000, 5, 'rl:auth:');
const apiLimiter = createRateLimiter(60 * 1000, 100, 'rl:api:');
const swipeLimiter = createRateLimiter(60 * 1000, 30, 'rl:swipe:');

module.exports = { authLimiter, apiLimiter, swipeLimiter };
