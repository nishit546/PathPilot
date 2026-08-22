const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const generateToken = require('../utils/generateToken');
const ApiError = require('../utils/ApiError');

class AuthService {
  async register(userData) {
    const existing = await userRepository.findByEmail(userData.email);
    if (existing) {
      throw ApiError.conflict('An account with this email address already exists.');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const createdUser = await userRepository.create({
      ...userData,
      password: hashedPassword
    });

    const token = generateToken(createdUser.id, createdUser.role);

    return {
      user: createdUser,
      token
    };
  }

  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    if (user.isBlocked) {
      throw ApiError.forbidden('Your account has been suspended. Please contact customer support.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    const token = generateToken(user.id, user.role);
    const { password: _, ...safeUser } = user;

    return {
      user: safeUser,
      token
    };
  }

  async getMe(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    if (user.isBlocked) {
      throw ApiError.forbidden('Your account has been suspended.');
    }

    const { password, ...safeUser } = user;
    return safeUser;
  }
}

module.exports = new AuthService();
