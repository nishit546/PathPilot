/**
 * Centralized error handling middleware for PathPilot.
 * Formats all errors into standard JSON responses:
 * {
 *   "success": false,
 *   "message": "...",
 *   "errors": []
 * }
 */
const errorMiddleware = (err, req, res, next) => {
  // Handle bad JSON body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload in request body',
      errors: [{ message: 'Malformed JSON payload in request body' }]
    });
  }

  let statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
  let message = err.message || 'Internal Server Error';
  let errors = err.errors && Array.isArray(err.errors) ? err.errors : [];

  // PostgreSQL Error Code mappings
  if (err.code === '23505') {
    // Unique violation
    statusCode = 409;
    message = err.detail || 'Resource already exists or unique constraint violated.';
    errors = [{ message }];
  } else if (err.code === '23503') {
    // Foreign key violation
    statusCode = 400;
    message = err.detail || 'Referenced parent record does not exist or has foreign dependencies.';
    errors = [{ message }];
  } else if (err.code === '22P02') {
    // Invalid text/UUID representation
    statusCode = 400;
    message = 'Invalid ID or parameter format provided.';
    errors = [{ message }];
  } else if (err.code === '23514') {
    // Check constraint violation
    statusCode = 400;
    message = err.detail || 'Value failed business rule validation constraint.';
    errors = [{ message }];
  }

  // Log 500 errors in development
  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    console.error('💥 Unhandled Internal Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorMiddleware;
