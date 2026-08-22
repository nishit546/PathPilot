const tripService = require('../services/tripService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { buildPaginationMetadata } = require('../utils/pagination');

const getTrips = asyncHandler(async (req, res) => {
  const result = await tripService.getUserTrips(req.user.id, req.query);
  const paginationMeta = buildPaginationMetadata(result.total, result.page, result.limit);
  return sendPaginated(res, 'User trips retrieved successfully', result.trips, paginationMeta, 200);
});

const getTripById = asyncHandler(async (req, res) => {
  const trip = await tripService.getTripById(req.params.id, req.user ? req.user.id : null);
  return sendSuccess(res, 'Trip details retrieved successfully', { trip }, 200);
});

const createTrip = asyncHandler(async (req, res) => {
  const trip = await tripService.createTrip(req.user.id, req.body);
  return sendSuccess(res, 'Trip created successfully', { trip }, 201);
});

const updateTrip = asyncHandler(async (req, res) => {
  const trip = await tripService.updateTrip(req.params.id, req.user.id, req.body);
  return sendSuccess(res, 'Trip updated successfully', { trip }, 200);
});

const deleteTrip = asyncHandler(async (req, res) => {
  const result = await tripService.deleteTrip(req.params.id, req.user.id);
  return sendSuccess(res, result.message, {}, 200);
});

const getTripHealth = asyncHandler(async (req, res) => {
  const tripHealthService = require('../services/tripHealthService');
  const health = await tripHealthService.analyzeTripHealth(
    req.params.tripId || req.params.id,
    req.user.id,
    req.query
  );
  return sendSuccess(res, 'Trip health analysis retrieved successfully', health, 200);
});

module.exports = {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  getTripHealth
};

