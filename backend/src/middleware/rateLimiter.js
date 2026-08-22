const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * General API Rate Limiter
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

/**
 * Stricter Rate Limiter for Authentication routes (Register, Login)
 */
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again later.'
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};
