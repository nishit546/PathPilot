const collaboratorService = require('../services/collaboratorService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { buildPaginationMetadata } = require('../utils/pagination');

const inviteCollaborator = asyncHandler(async (req, res) => {
  const result = await collaboratorService.inviteCollaborator(req.params.tripId, req.user.id, req.body);
  return sendSuccess(res, 'Collaborator added successfully', result, 201);
});

const getCollaborators = asyncHandler(async (req, res) => {
  const result = await collaboratorService.getCollaborators(req.params.tripId, req.user.id);
  return sendSuccess(res, 'Collaborators retrieved successfully', result, 200);
});

const updateCollaboratorRole = asyncHandler(async (req, res) => {
  const result = await collaboratorService.updateCollaboratorRole(
    req.params.tripId,
    req.user.id,
    req.params.userId,
    req.body.role
  );
  return sendSuccess(res, 'Collaborator role updated successfully', result, 200);
});

const removeCollaborator = asyncHandler(async (req, res) => {
  const result = await collaboratorService.removeCollaborator(
    req.params.tripId,
    req.user.id,
    req.params.userId
  );
  return sendSuccess(res, result.message, {}, 200);
});

const getSharedWithMeTrips = asyncHandler(async (req, res) => {
  const result = await collaboratorService.getSharedWithMeTrips(req.user.id, req.query);
  const paginationMeta = buildPaginationMetadata(result.total, result.page, result.limit);
  return sendPaginated(res, 'Shared trips retrieved successfully', result.trips, paginationMeta, 200);
});

const getActivityLogs = asyncHandler(async (req, res) => {
  const result = await collaboratorService.getActivityLogs(req.params.tripId, req.user.id, req.query);
  const paginationMeta = buildPaginationMetadata(result.total, result.page, result.limit);
  return sendPaginated(res, 'Trip activity logs retrieved successfully', result.logs, paginationMeta, 200);
});

module.exports = {
  inviteCollaborator,
  getCollaborators,
  updateCollaboratorRole,
  removeCollaborator,
  getSharedWithMeTrips,
  getActivityLogs
};
