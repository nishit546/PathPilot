/**
 * Custom API Error class for consistent error formatting and HTTP status codes.
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = 'Bad Request', errors = []) {
    return new ApiError(400, msg, errors);
  }

  static unauthorized(msg = 'Unauthorized access') {
    return new ApiError(401, msg);
  }

  static forbidden(msg = 'Forbidden - Insufficient permissions') {
    return new ApiError(403, msg);
  }

  static notFound(msg = 'Resource not found') {
    return new ApiError(404, msg);
  }

  static conflict(msg = 'Resource conflict', errors = []) {
    return new ApiError(409, msg, errors);
  }

  static unprocessable(msg = 'Unprocessable entity', errors = []) {
    return new ApiError(422, msg, errors);
  }

  static tooManyRequests(msg = 'Too many requests, please try again later.') {
    return new ApiError(429, msg);
  }

  static internal(msg = 'Internal Server Error') {
    return new ApiError(500, msg);
  }
}

module.exports = ApiError;
