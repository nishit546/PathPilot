const ApiError = require('../utils/ApiError');

/**
 * Middleware to restrict access to ADMIN users only.
 * Must be placed after `authMiddleware`.
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user || String(req.user.role || '').toUpperCase() !== 'ADMIN') {
    return next(ApiError.forbidden('Access denied. Administrator privileges required.'));
  }
  next();
};

module.exports = adminMiddleware;
