const analyticsService = require('../services/analyticsService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const getUserDashboard = asyncHandler(async (req, res) => {
  const result = await analyticsService.getUserDashboard(req.user.id);
  return sendSuccess(res, 'User travel dashboard analytics retrieved successfully', result, 200);
});

const getSpendingAnalytics = asyncHandler(async (req, res) => {
  const result = await analyticsService.getSpendingAnalytics(req.user.id, req.query);
  return sendSuccess(res, 'Spending analytics calculated successfully', result, 200);
});

const getActivityInsights = asyncHandler(async (req, res) => {
  const result = await analyticsService.getActivityInsights(req.user.id);
  return sendSuccess(res, 'Activity analytics and patterns retrieved successfully', result, 200);
});

const getCityInsights = asyncHandler(async (req, res) => {
  const result = await analyticsService.getCityInsights(req.user.id);
  return sendSuccess(res, 'City travel patterns retrieved successfully', result, 200);
});

const getTravelTimeline = asyncHandler(async (req, res) => {
  const result = await analyticsService.getTravelTimeline(req.user.id, req.query);
  return sendSuccess(res, 'Travel timeline analytics retrieved successfully', result, 200);
});

const compareTrips = asyncHandler(async (req, res) => {
  const tripIds = req.query.tripIds; // Already parsed to array of numbers by validation schema
  const result = await analyticsService.compareTrips(req.user.id, tripIds);
  return sendSuccess(res, 'Trip comparison generated successfully', result, 200);
});

const getSmartInsights = asyncHandler(async (req, res) => {
  const result = await analyticsService.getSmartInsights(req.user.id);
  return sendSuccess(res, 'Smart travel insights generated successfully', result, 200);
});

const getAchievements = asyncHandler(async (req, res) => {
  const result = await analyticsService.getAchievements(req.user.id);
  return sendSuccess(res, 'Travel achievements and milestones calculated successfully', result, 200);
});

const getSingleTripInsights = asyncHandler(async (req, res) => {
  const result = await analyticsService.getSingleTripInsights(req.params.tripId, req.user.id);
  return sendSuccess(res, 'Trip-specific insights calculated successfully', result, 200);
});

module.exports = {
  getUserDashboard,
  getSpendingAnalytics,
  getActivityInsights,
  getCityInsights,
  getTravelTimeline,
  compareTrips,
  getSmartInsights,
  getAchievements,
  getSingleTripInsights
};
