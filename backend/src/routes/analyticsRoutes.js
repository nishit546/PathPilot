const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  spendingAnalyticsSchema,
  timelineAnalyticsSchema,
  compareTripsSchema
} = require('../validators/analyticsValidator');

const router = express.Router();

// 1. Personal Travel Dashboard Overview
router.get('/dashboard', authMiddleware, analyticsController.getUserDashboard);

// 2. Spending Analytics
router.get('/spending', authMiddleware, validate(spendingAnalyticsSchema, 'query'), analyticsController.getSpendingAnalytics);

// 3. Activity Patterns & Frequency
router.get('/activities', authMiddleware, analyticsController.getActivityInsights);

// 4. City Preferences & Visited Stats
router.get('/cities', authMiddleware, analyticsController.getCityInsights);

// 5. Travel Timeline
router.get('/travel-timeline', authMiddleware, validate(timelineAnalyticsSchema, 'query'), analyticsController.getTravelTimeline);

// 6. Multi-Trip Comparison Engine
router.get('/compare', authMiddleware, validate(compareTripsSchema, 'query'), analyticsController.compareTrips);

// 7. Smart Travel Insights
router.get('/insights', authMiddleware, analyticsController.getSmartInsights);

// 8. Dynamic Travel Achievements
router.get('/achievements', authMiddleware, analyticsController.getAchievements);

module.exports = router;
