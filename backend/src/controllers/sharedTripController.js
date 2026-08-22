const sharedTripService = require('../services/sharedTripService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const shareTrip = asyncHandler(async (req, res) => {
  const result = await sharedTripService.generateShareToken(req.params.tripId, req.user.id);
  return sendSuccess(res, 'Trip share link generated successfully', result, 201);
});

const getSharedTrip = asyncHandler(async (req, res) => {
  const trip = await sharedTripService.getSharedTrip(req.params.shareToken);
  return sendSuccess(res, 'Shared trip details retrieved successfully', { trip }, 200);
});

const revokeShare = asyncHandler(async (req, res) => {
  const result = await sharedTripService.revokeShareToken(req.params.tripId, req.user.id);
  return sendSuccess(res, result.message, {}, 200);
});

module.exports = {
  shareTrip,
  getSharedTrip,
  revokeShare
};
