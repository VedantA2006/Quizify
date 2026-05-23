const rateLimit = require('express-rate-limit');
const RateLimitMongo = require('rate-limit-mongo');
const env = require('../config/env');

const mongoStore = (windowMs) => new RateLimitMongo({
  uri: env.MONGODB_URI,
  expireTimeMs: windowMs,
  errorHandler: (err) => console.error('RateLimitMongo error:', err),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // tightened to 10 per 15 minutes
  store: mongoStore(15 * 60 * 1000),
  message: { success: false, message: 'Too many login/register attempts, try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  store: mongoStore(60 * 1000),
  message: { success: false, message: 'Too many AI requests, try again in a minute' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  store: mongoStore(60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // max 20 per hour
  store: mongoStore(60 * 60 * 1000),
  message: { success: false, message: 'Too many upload attempts, try again in an hour' },
  standardHeaders: true,
  legacyHeaders: false,
});

const codeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // max 30 per minute
  store: mongoStore(60 * 1000),
  message: { success: false, message: 'Too many code sandbox execution attempts, try again in a minute' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, aiLimiter, generalLimiter, uploadLimiter, codeLimiter };
