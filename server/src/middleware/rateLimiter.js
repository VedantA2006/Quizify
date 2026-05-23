const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // relaxed for development testing
  message: { success: false, message: 'Too many login/register attempts, try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { singleCount: false },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many AI requests, try again in a minute' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { singleCount: false },
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { singleCount: false },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: { success: false, message: 'Too many upload attempts, try again in an hour' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { singleCount: false },
});

const codeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { success: false, message: 'Too many code sandbox execution attempts, try again in a minute' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { singleCount: false },
});

module.exports = { authLimiter, aiLimiter, generalLimiter, uploadLimiter, codeLimiter };
