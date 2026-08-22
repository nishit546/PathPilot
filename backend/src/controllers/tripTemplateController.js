const tripTemplateService = require('../services/tripTemplateService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { buildPaginationMetadata } = require('../utils/pagination');

const createTemplateFromTrip = asyncHandler(async (req, res) => {
  const template = await tripTemplateService.createTemplateFromTrip(req.params.tripId, req.user.id, req.body);
  return sendSuccess(res, 'Trip converted into template successfully', { template }, 201);
});

const getMyTemplates = asyncHandler(async (req, res) => {
  const result = await tripTemplateService.getMyTemplates(req.user.id, req.query);
  const paginationMeta = buildPaginationMetadata(result.total, result.page, result.limit);
  return sendPaginated(res, 'User templates retrieved successfully', result.templates, paginationMeta, 200);
});

const getPublicTemplates = asyncHandler(async (req, res) => {
  const result = await tripTemplateService.getPublicTemplates(req.query);
  const paginationMeta = buildPaginationMetadata(result.total, result.page, result.limit);
  return sendPaginated(res, 'Public templates retrieved successfully', result.templates, paginationMeta, 200);
});

const getTemplateById = asyncHandler(async (req, res) => {
  const template = await tripTemplateService.getTemplateById(req.params.id, req.user ? req.user.id : null);
  return sendSuccess(res, 'Template details retrieved successfully', { template }, 200);
});

const updateTemplate = asyncHandler(async (req, res) => {
  const template = await tripTemplateService.updateTemplate(req.params.id, req.user.id, req.body);
  return sendSuccess(res, 'Template updated successfully', { template }, 200);
});

const deleteTemplate = asyncHandler(async (req, res) => {
  const result = await tripTemplateService.deleteTemplate(req.params.id, req.user.id);
  return sendSuccess(res, result.message, {}, 200);
});

const useTemplate = asyncHandler(async (req, res) => {
  const result = await tripTemplateService.useTemplate(req.params.id, req.user.id, req.body);
  return sendSuccess(res, 'Trip created from template successfully', result, 201);
});

const duplicateTrip = asyncHandler(async (req, res) => {
  const result = await tripTemplateService.duplicateTrip(req.params.tripId, req.user.id, req.body);
  return sendSuccess(res, 'Trip duplicated successfully', result, 201);
});

const copySharedTrip = asyncHandler(async (req, res) => {
  const result = await tripTemplateService.copySharedTrip(req.params.shareToken, req.user.id);
  return sendSuccess(res, 'Shared trip copied to your personal account successfully', result, 201);
});

const favoriteTemplate = asyncHandler(async (req, res) => {
  const favorite = await tripTemplateService.favoriteTemplate(req.params.id, req.user.id);
  return sendSuccess(res, 'Template added to favorites', { favorite }, 201);
});

const unfavoriteTemplate = asyncHandler(async (req, res) => {
  const result = await tripTemplateService.unfavoriteTemplate(req.params.id, req.user.id);
  return sendSuccess(res, result.message, {}, 200);
});

const getMyFavorites = asyncHandler(async (req, res) => {
  const result = await tripTemplateService.getMyFavorites(req.user.id, req.query);
  const paginationMeta = buildPaginationMetadata(result.total, result.page, result.limit);
  return sendPaginated(res, 'Favorite templates retrieved successfully', result.favorites, paginationMeta, 200);
});

module.exports = {
  createTemplateFromTrip,
  getMyTemplates,
  getPublicTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  useTemplate,
  duplicateTrip,
  copySharedTrip,
  favoriteTemplate,
  unfavoriteTemplate,
  getMyFavorites
};
