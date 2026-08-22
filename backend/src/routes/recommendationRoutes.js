const express = require('express');
const recommendationController = require('../controllers/recommendationController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  tripRecommendationSchema,
  budgetOptimizerSchema,
  itinerarySuggestionSchema
} = require('../validators/recommendationValidator');

const router = express.Router();

// Trip Recommendation (Supports authenticated or anonymous exploration)
router.post('/trip', validate(tripRecommendationSchema), recommendationController.getTripRecommendations);

// Budget Optimization
router.post('/budget-optimizer', validate(budgetOptimizerSchema), recommendationController.optimizeBudget);

// Itinerary Suggestions (Requires authenticated trip owner)
router.post('/itinerary-suggestions', authMiddleware, validate(itinerarySuggestionSchema), recommendationController.getItinerarySuggestions);

// Personalized Recommendations (Requires authenticated user)
router.get('/personalized', authMiddleware, recommendationController.getPersonalizedRecommendations);

module.exports = router;
