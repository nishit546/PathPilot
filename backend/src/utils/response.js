/**
 * Standard API response helper utilities for PathPilot.
 */

/**
 * Send a standardized success response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {any} data
 * @param {number} [statusCode=200]
 */
const sendSuccess = (res, message = 'Operation successful', data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Send a standardized paginated response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {any[]} data
 * @param {object} pagination
 * @param {number} [statusCode=200]
 */
const sendPaginated = (res, message = 'Data retrieved successfully', data = [], pagination = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || data.length,
      totalItems: pagination.totalItems !== undefined ? pagination.totalItems : data.length,
      totalPages: pagination.totalPages !== undefined ? pagination.totalPages : 1,
      hasNextPage: Boolean(pagination.hasNextPage),
      hasPreviousPage: Boolean(pagination.hasPreviousPage)
    }
  });
};

/**
 * Send a standardized error response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {any[]} [errors=[]]
 * @param {number} [statusCode=400]
 */
const sendError = (res, message = 'An error occurred', errors = [], statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : undefined
  });
};

module.exports = {
  sendSuccess,
  sendPaginated,
  sendError
};
