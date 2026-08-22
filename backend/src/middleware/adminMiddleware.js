const ApiError = require('../utils/ApiError');

/**
 * Middleware to restrict access to ADMIN users only.
 * Must be placed after `authMiddleware`.
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return next(ApiError.forbidden('Access denied. Administrator privileges required.'));
  }
  next();
};

module.exports = adminMiddleware;
