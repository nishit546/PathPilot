const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/ApiError');

/**
 * Middleware to authenticate requests using JWT Bearer tokens.
 * Attaches authenticated user object to `req.user`.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access denied. No authentication token provided.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw ApiError.unauthorized('Invalid authorization header format.');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Authentication token has expired. Please log in again.');
      }
      throw ApiError.unauthorized('Invalid authentication token.');
    }

    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw ApiError.unauthorized('The user associated with this token no longer exists.');
    }

    if (user.isBlocked) {
      throw ApiError.forbidden('Your account has been suspended. Please contact support.');
    }

    // Exclude password if present
    const { password, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;
