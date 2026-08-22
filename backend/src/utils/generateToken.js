const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token for a user.
 * @param {string|number} userId - The user's ID
 * @param {string} role - The user's role (USER | ADMIN)
 * @returns {string} - Signed JWT
 */
const generateToken = (userId, role = 'USER') => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = generateToken;
