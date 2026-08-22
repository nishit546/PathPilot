const ApiError = require('../utils/ApiError');

/**
 * 404 Not Found Handler for undefined routes.
 */
const notFoundMiddleware = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = notFoundMiddleware;
