const searchService = require('../services/searchService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const globalSearch = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const result = await searchService.globalSearch(userId, req.query);
  return sendSuccess(res, 'Global search executed successfully', result, 200);
});

const searchUserTrips = asyncHandler(async (req, res) => {
  const result = await searchService.searchUserTrips(req.user.id, req.query);
  return sendSuccess(res, 'User trips retrieved successfully', result, 200);
});

const searchActivities = asyncHandler(async (req, res) => {
  const result = await searchService.searchActivities(req.query);
  return sendSuccess(res, 'Activities search results retrieved successfully', result, 200);
});

const searchCities = asyncHandler(async (req, res) => {
  const result = await searchService.searchCities(req.query);
  return sendSuccess(res, 'Cities search results retrieved successfully', result, 200);
});

const searchTemplates = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const result = await searchService.searchTemplates(userId, req.query);
  return sendSuccess(res, 'Templates search results retrieved successfully', result, 200);
});

const searchCommunity = asyncHandler(async (req, res) => {
  const result = await searchService.searchCommunity(req.query);
  return sendSuccess(res, 'Community posts search results retrieved successfully', result, 200);
});

const getSearchSuggestions = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const result = await searchService.getSearchSuggestions(userId, req.query.q);
  return sendSuccess(res, 'Search suggestions retrieved successfully', result, 200);
});

const getRecentSearches = asyncHandler(async (req, res) => {
  const result = await searchService.getRecentSearches(req.user.id);
  return sendSuccess(res, 'Recent searches retrieved successfully', result, 200);
});

const clearRecentSearches = asyncHandler(async (req, res) => {
  const result = await searchService.clearRecentSearches(req.user.id);
  return sendSuccess(res, result.message, {}, 200);
});

const deleteRecentSearch = asyncHandler(async (req, res) => {
  const result = await searchService.deleteRecentSearch(req.user.id, req.params.searchId);
  return sendSuccess(res, result.message, {}, 200);
});

const getPopularSearches = asyncHandler(async (req, res) => {
  const result = await searchService.getPopularSearches();
  return sendSuccess(res, 'Popular searches retrieved successfully', result, 200);
});

module.exports = {
  globalSearch,
  searchUserTrips,
  searchActivities,
  searchCities,
  searchTemplates,
  searchCommunity,
  getSearchSuggestions,
  getRecentSearches,
  clearRecentSearches,
  deleteRecentSearch,
  getPopularSearches
};
