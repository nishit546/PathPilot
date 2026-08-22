const tripPreparationService = require('../services/tripPreparationService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

// ==========================================
// PACKING LIST CONTROLLERS
// ==========================================

const getPackingList = asyncHandler(async (req, res) => {
  const result = await tripPreparationService.getPackingList(req.params.tripId, req.user.id, req.query);
  return sendSuccess(res, 'Trip packing list retrieved successfully', result, 200);
});

const addPackingItem = asyncHandler(async (req, res) => {
  const result = await tripPreparationService.addPackingItem(req.params.tripId, req.user.id, req.body);
  return sendSuccess(res, 'Packing item added successfully', { item: result }, 201);
});

const updatePackingItem = asyncHandler(async (req, res) => {
  const result = await tripPreparationService.updatePackingItem(
    req.params.tripId,
    req.params.itemId,
    req.user.id,
    req.body
  );
  return sendSuccess(res, 'Packing item updated successfully', { item: result }, 200);
});

const deletePackingItem = asyncHandler(async (req, res) => {
  const result = await tripPreparationService.deletePackingItem(
    req.params.tripId,
    req.params.itemId,
    req.user.id
  );
  return sendSuccess(res, result.message, {}, 200);
});

const bulkUpdatePackingStatus = asyncHandler(async (req, res) => {
  const result = await tripPreparationService.bulkUpdatePackingStatus(
    req.params.tripId,
    req.user.id,
    req.body.items
  );
  return sendSuccess(res, 'Packing items bulk updated successfully', result, 200);
});

const getPackingSuggestions = asyncHandler(async (req, res) => {
  const result = await tripPreparationService.getPackingSuggestions(req.params.tripId, req.user.id);
  return sendSuccess(res, 'Smart packing suggestions generated successfully', result, 200);
});

const addSuggestionToPackingList = asyncHandler(async (req, res) => {
  const result = await tripPreparationService.addSuggestionToPackingList(
    req.params.tripId,
    req.params.suggestionId,
    req.user.id,
    req.body
  );
  return sendSuccess(res, 'Suggested item added to packing list', { item: result }, 201);
});

// ==========================================
// TRAVEL DOCUMENTS CONTROLLERS
// ==========================================

const getTravelDocuments = asyncHandler(async (req, res) => {
  const result = await tripPreparationService.getTravelDocuments(req.params.tripId, req.user.id);
  return sendSuccess(res, 'Travel documents retrieved successfully', result, 200);
});

const createTravelDocument = asyncHandler(async (req, res) => {
  const result = await tripPreparationService.createTravelDocument(req.params.tripId, req.user.id, req.body);
  return sendSuccess(res, 'Travel document added successfully', { document: result }, 201);
});

const updateTravelDocument = asyncHandler(async (req, res) => {
  const result = await tripPreparationService.updateTravelDocument(
    req.params.tripId,
    req.params.documentId,
    req.user.id,
    req.body
  );
  return sendSuccess(res, 'Travel document updated successfully', { document: result }, 200);
});

const deleteTravelDocument = asyncHandler(async (req, res) => {
  const result = await tripPreparationService.deleteTravelDocument(
    req.params.tripId,
    req.params.documentId,
    req.user.id
  );
  return sendSuccess(res, result.message, {}, 200);
});

// ==========================================
// PREPARATION TASKS CONTROLLERS
// ==========================================

const getPreparationTasks = asyncHandler(async (req, res) => {
  const result = await tripPreparationService.getPreparationTasks(req.params.tripId, req.user.id);
  return sendSuccess(res, 'Preparation tasks retrieved successfully', result, 200);
});

const createPreparationTask = asyncHandler(async (req, res) => {
  const result = await tripPreparationService.createPreparationTask(req.params.tripId, req.user.id, req.body);
  return sendSuccess(res, 'Preparation task created successfully', { task: result }, 201);
});

const updatePreparationTask = asyncHandler(async (req, res) => {
  const result = await tripPreparationService.updatePreparationTask(
    req.params.tripId,
    req.params.taskId,
    req.user.id,
    req.body
  );
  return sendSuccess(res, 'Preparation task updated successfully', { task: result }, 200);
});

const deletePreparationTask = asyncHandler(async (req, res) => {
  const result = await tripPreparationService.deletePreparationTask(
    req.params.tripId,
    req.params.taskId,
    req.user.id
  );
  return sendSuccess(res, result.message, {}, 200);
});

// ==========================================
// TRIP READINESS SCORING CONTROLLER
// ==========================================

const getTripReadiness = asyncHandler(async (req, res) => {
  const triggerAlerts = req.query.triggerAlerts !== 'false';
  const result = await tripPreparationService.getTripReadiness(req.params.tripId, req.user.id, triggerAlerts);
  return sendSuccess(res, 'Trip readiness analysis calculated successfully', result, 200);
});

module.exports = {
  getPackingList,
  addPackingItem,
  updatePackingItem,
  deletePackingItem,
  bulkUpdatePackingStatus,
  getPackingSuggestions,
  addSuggestionToPackingList,
  getTravelDocuments,
  createTravelDocument,
  updateTravelDocument,
  deleteTravelDocument,
  getPreparationTasks,
  createPreparationTask,
  updatePreparationTask,
  deletePreparationTask,
  getTripReadiness
};
