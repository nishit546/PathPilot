/**
 * Centralized error handling middleware.
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
      message: 'Malformed JSON payload in request body'
    });
  }

  const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
  const message = err.message || 'Internal Server Error';
  const errors = err.errors || [];

  // Log 500 errors in development
  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    console.error('💥 Unhandled Internal Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : undefined,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorMiddleware;
