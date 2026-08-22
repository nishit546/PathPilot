const recommendationService = require('../services/recommendationService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const getTripRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const recommendations = await recommendationService.getTripRecommendations(userId, req.body);
  return sendSuccess(res, 'Trip recommendations generated successfully', recommendations, 200);
});

const optimizeBudget = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const optimization = await recommendationService.getBudgetOptimization(userId, req.body);
  return sendSuccess(res, 'Budget optimization calculated successfully', optimization, 200);
});

const getItinerarySuggestions = asyncHandler(async (req, res) => {
  const suggestions = await recommendationService.getItinerarySuggestions(req.body.tripId, req.user.id);
  return sendSuccess(res, 'Itinerary suggestions generated successfully', suggestions, 200);
});

const getPersonalizedRecommendations = asyncHandler(async (req, res) => {
  const personalized = await recommendationService.getPersonalizedRecommendations(req.user.id);
  return sendSuccess(res, 'Personalized recommendations retrieved successfully', personalized, 200);
});

module.exports = {
  getTripRecommendations,
  optimizeBudget,
  getItinerarySuggestions,
  getPersonalizedRecommendations
};
