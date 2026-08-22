const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return sendSuccess(res, 'User registered successfully', result, 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  return sendSuccess(res, 'Login successful', result, 200);
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  return sendSuccess(res, 'User profile retrieved successfully', { user }, 200);
});

const logout = asyncHandler(async (req, res) => {
  return sendSuccess(res, 'Logged out successfully', {}, 200);
});

module.exports = {
  register,
  login,
  getMe,
  logout
};
