const userRepository = require('../repositories/userRepository');
const analyticsService = require('../services/analyticsService');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { buildPaginationMetadata } = require('../utils/pagination');

const getUsers = asyncHandler(async (req, res) => {
  const result = await userRepository.findAll(req.query);
  const paginationMeta = buildPaginationMetadata(result.total, result.page, result.limit);
  return sendPaginated(res, 'Users retrieved successfully', result.users, paginationMeta, 200);
});

const blockUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  if (!targetId) {
    throw ApiError.badRequest('Invalid user ID parameter.');
  }

  if (String(targetId) === String(req.user.id)) {
    throw ApiError.badRequest('You cannot block your own administrator account.');
  }

  const user = await userRepository.findById(targetId);
  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  if (String(user.role || '').toUpperCase() === 'ADMIN') {
    throw ApiError.forbidden('Administrator accounts cannot be blocked.');
  }

  if (user.isBlocked) {
    return sendSuccess(res, `User ${user.email} is already blocked.`, { user }, 200);
  }

  const updated = await userRepository.update(targetId, { isBlocked: true });
  return sendSuccess(res, `User ${updated.email} has been blocked successfully.`, { user: updated }, 200);
});

const unblockUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  if (!targetId) {
    throw ApiError.badRequest('Invalid user ID parameter.');
  }

  const user = await userRepository.findById(targetId);
  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  if (!user.isBlocked) {
    return sendSuccess(res, `User ${user.email} is already active/unblocked.`, { user }, 200);
  }

  const updated = await userRepository.update(targetId, { isBlocked: false });
  return sendSuccess(res, `User ${updated.email} has been unblocked successfully.`, { user: updated }, 200);
});

const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await analyticsService.getAdminAnalytics();
  return sendSuccess(res, 'System analytics retrieved successfully', analytics, 200);
});

module.exports = {
  getUsers,
  blockUser,
  unblockUser,
  getAnalytics
};
