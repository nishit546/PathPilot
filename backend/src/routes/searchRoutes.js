const express = require('express');
const searchController = require('../controllers/searchController');
const authMiddleware = require('../middleware/authMiddleware');
const optionalAuthMiddleware = require('../middleware/optionalAuthMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  globalSearchSchema,
  suggestionsSchema
} = require('../validators/searchValidator');

const router = express.Router();

// 1. Global Multi-Resource Unified Search
router.get('/', optionalAuthMiddleware, validate(globalSearchSchema, 'query'), searchController.globalSearch);

// 2. Instant Search Suggestions
router.get('/suggestions', optionalAuthMiddleware, validate(suggestionsSchema, 'query'), searchController.getSearchSuggestions);

// 3. Popular Searches Engine
router.get('/popular', searchController.getPopularSearches);

// 4. Recent Searches
router.get('/recent', authMiddleware, searchController.getRecentSearches);
router.delete('/recent', authMiddleware, searchController.clearRecentSearches);
router.delete('/recent/:searchId', authMiddleware, searchController.deleteRecentSearch);

module.exports = router;
