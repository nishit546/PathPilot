const routeService = require('../services/routeService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const getTripRoute = asyncHandler(async (req, res) => {
  const result = await routeService.getTripRoute(req.params.tripId, req.user.id);
  return sendSuccess(res, 'Trip route retrieved successfully', result, 200);
});

const reorderTripCities = asyncHandler(async (req, res) => {
  const result = await routeService.reorderTripCities(req.params.tripId, req.user.id, req.body);
  return sendSuccess(res, 'Trip cities reordered successfully', result, 200);
});

const getRouteOptimization = asyncHandler(async (req, res) => {
  const result = await routeService.getRouteOptimization(req.params.tripId, req.user.id);
  return sendSuccess(res, 'Route optimization analysis calculated successfully', result, 200);
});

const applyRouteOptimization = asyncHandler(async (req, res) => {
  const result = await routeService.applyRouteOptimization(req.params.tripId, req.user.id, req.body.sectionOrder);
  return sendSuccess(res, 'Optimized route applied successfully', result, 200);
});

const getTravelSegments = asyncHandler(async (req, res) => {
  const result = await routeService.getTravelSegments(req.params.tripId, req.user.id);
  return sendSuccess(res, 'Travel segments retrieved successfully', result, 200);
});

const getTravelSegmentOptions = asyncHandler(async (req, res) => {
  const result = await routeService.getTravelSegmentOptions(req.params.tripId, req.params.segmentId, req.user.id);
  return sendSuccess(res, 'Transport mode options retrieved successfully', result, 200);
});

const selectTransportOption = asyncHandler(async (req, res) => {
  const result = await routeService.selectTransportOption(
    req.params.tripId,
    req.params.segmentId,
    req.user.id,
    req.body.selectedMode
  );
  return sendSuccess(res, 'Transport mode selected successfully', result, 200);
});

const optimizeDayActivities = asyncHandler(async (req, res) => {
  const result = await routeService.optimizeDayActivities(req.params.tripId, req.params.dayId, req.user.id);
  return sendSuccess(res, 'Day activities optimization generated successfully', result, 200);
});

const applyDayOptimization = asyncHandler(async (req, res) => {
  const result = await routeService.applyDayOptimization(req.params.tripId, req.params.dayId, req.user.id, req.body.activityOrder);
  return sendSuccess(res, 'Day activities optimization applied successfully', result, 200);
});

const getRouteConflicts = asyncHandler(async (req, res) => {
  const result = await routeService.getRouteConflicts(req.params.tripId, req.user.id);
  return sendSuccess(res, 'Route conflicts analyzed successfully', result, 200);
});

const getRouteRecommendations = asyncHandler(async (req, res) => {
  const result = await routeService.getRouteRecommendations(req.params.tripId, req.user.id);
  return sendSuccess(res, 'Smart route recommendations retrieved successfully', result, 200);
});

const getRouteScore = asyncHandler(async (req, res) => {
  const result = await routeService.getRouteScore(req.params.tripId, req.user.id);
  return sendSuccess(res, 'Route score and health breakdown calculated successfully', result, 200);
});

module.exports = {
  getTripRoute,
  reorderTripCities,
  getRouteOptimization,
  applyRouteOptimization,
  getTravelSegments,
  getTravelSegmentOptions,
  selectTransportOption,
  optimizeDayActivities,
  applyDayOptimization,
  getRouteConflicts,
  getRouteRecommendations,
  getRouteScore
};
