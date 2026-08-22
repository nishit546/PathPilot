const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

/**
 * Optional authentication middleware.
 * If a valid JWT token is provided, attaches `req.user`.
 * If no token is provided, proceeds normally with `req.user = null`.
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      const user = await userRepository.findById(decoded.id);

      if (user && !user.isBlocked) {
        const { password, ...safeUser } = user;
        req.user = safeUser;
      } else {
        req.user = null;
      }
    } catch {
      req.user = null;
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = optionalAuthMiddleware;
