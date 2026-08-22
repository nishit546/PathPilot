const activityService = require('../services/activityService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { buildPaginationMetadata } = require('../utils/pagination');

const getActivities = asyncHandler(async (req, res) => {
  const result = await activityService.getAllActivities(req.query);
  const paginationMeta = buildPaginationMetadata(result.total, result.page, result.limit);
  return sendPaginated(res, 'Activities retrieved successfully', result.activities, paginationMeta, 200);
});

const getActivityById = asyncHandler(async (req, res) => {
  const activity = await activityService.getActivityById(req.params.id);
  return sendSuccess(res, 'Activity details retrieved successfully', { activity }, 200);
});

const getDayActivities = asyncHandler(async (req, res) => {
  const activities = await activityService.getDayActivities(req.params.dayId, req.user ? req.user.id : null);
  return sendSuccess(res, 'Day activities retrieved successfully', { activities, count: activities.length }, 200);
});

const assignDayActivity = asyncHandler(async (req, res) => {
  const dayActivity = await activityService.assignDayActivity(req.params.dayId, req.user.id, req.body);
  return sendSuccess(res, 'Activity scheduled for day successfully', { dayActivity }, 201);
});

const updateDayActivity = asyncHandler(async (req, res) => {
  const dayActivity = await activityService.updateDayActivity(req.params.id, req.user.id, req.body);
  return sendSuccess(res, 'Scheduled activity updated successfully', { dayActivity }, 200);
});

const deleteDayActivity = asyncHandler(async (req, res) => {
  const result = await activityService.deleteDayActivity(req.params.id, req.user.id);
  return sendSuccess(res, result.message, {}, 200);
});

const reorderDayActivities = asyncHandler(async (req, res) => {
  const { activityIds } = req.body;
  const activities = await activityService.reorderDayActivities(req.params.dayId, req.user.id, activityIds);
  return sendSuccess(res, 'Day activities reordered successfully', { activities }, 200);
});

module.exports = {
  getActivities,
  getActivityById,
  getDayActivities,
  assignDayActivity,
  updateDayActivity,
  deleteDayActivity,
  reorderDayActivities
};
