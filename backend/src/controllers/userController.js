const userService = require('../services/userService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const getProfile = asyncHandler(async (req, res) => {
  const profile = await userService.getProfile(req.user.id);
  return sendSuccess(res, 'User profile retrieved successfully', { user: profile }, 200);
});

const updateProfile = asyncHandler(async (req, res) => {
  const updatedProfile = await userService.updateProfile(req.user.id, req.body);
  return sendSuccess(res, 'User profile updated successfully', { user: updatedProfile }, 200);
});

const deleteProfile = asyncHandler(async (req, res) => {
  const result = await userService.deleteProfile(req.user.id);
  return sendSuccess(res, result.message, {}, 200);
});

const getProfileTrips = asyncHandler(async (req, res) => {
  const tripSummary = await userService.getProfileTrips(req.user.id);
  return sendSuccess(res, 'User trips retrieved and categorized successfully', tripSummary, 200);
});

module.exports = {
  getProfile,
  updateProfile,
  deleteProfile,
  getProfileTrips
};
