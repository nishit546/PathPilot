const itineraryService = require('../services/itineraryService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const getTripSections = asyncHandler(async (req, res) => {
  const sections = await itineraryService.getTripSections(req.params.tripId, req.user ? req.user.id : null);
  return sendSuccess(res, 'Trip sections retrieved successfully', { sections, count: sections.length }, 200);
});

const getSectionById = asyncHandler(async (req, res) => {
  const section = await itineraryService.getSectionById(req.params.id, req.user ? req.user.id : null);
  return sendSuccess(res, 'Trip section retrieved successfully', { section }, 200);
});

const createSection = asyncHandler(async (req, res) => {
  const section = await itineraryService.createSection(req.params.tripId, req.user.id, req.body);
  return sendSuccess(res, 'Trip section created and days generated successfully', { section }, 201);
});

const updateSection = asyncHandler(async (req, res) => {
  const section = await itineraryService.updateSection(req.params.id, req.user.id, req.body);
  return sendSuccess(res, 'Trip section updated successfully', { section }, 200);
});

const deleteSection = asyncHandler(async (req, res) => {
  const result = await itineraryService.deleteSection(req.params.id, req.user.id);
  return sendSuccess(res, result.message, {}, 200);
});

const reorderSections = asyncHandler(async (req, res) => {
  const { sectionIds } = req.body;
  const sections = await itineraryService.reorderSections(req.params.tripId, req.user.id, sectionIds);
  return sendSuccess(res, 'Trip sections reordered successfully', { sections }, 200);
});

const getSectionDays = asyncHandler(async (req, res) => {
  const days = await itineraryService.getSectionDays(req.params.sectionId, req.user ? req.user.id : null);
  return sendSuccess(res, 'Section days retrieved successfully', { days, count: days.length }, 200);
});

const getDayById = asyncHandler(async (req, res) => {
  const day = await itineraryService.getDayById(req.params.id, req.user ? req.user.id : null);
  return sendSuccess(res, 'Day details retrieved successfully', { day }, 200);
});

const getTripDays = asyncHandler(async (req, res) => {
  const days = await itineraryService.getTripDays(req.params.tripId, req.user ? req.user.id : null);
  return sendSuccess(res, 'Trip days retrieved successfully', { days, count: days.length }, 200);
});

module.exports = {
  getTripSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
  getSectionDays,
  getDayById,
  getTripDays
};
