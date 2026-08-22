const express = require('express');
const tripController = require('../controllers/tripController');
const itineraryController = require('../controllers/itineraryController');
const activityController = require('../controllers/activityController');
const expenseController = require('../controllers/expenseController');
const budgetController = require('../controllers/budgetController');
const sharedTripController = require('../controllers/sharedTripController');
const recommendationController = require('../controllers/recommendationController');
const collaboratorController = require('../controllers/collaboratorController');
const tripTemplateController = require('../controllers/tripTemplateController');
const groupExpenseController = require('../controllers/groupExpenseController');
const tripPreparationController = require('../controllers/tripPreparationController');
const analyticsController = require('../controllers/analyticsController');
const searchController = require('../controllers/searchController');
const routeController = require('../controllers/routeController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { createTripSchema, updateTripSchema } = require('../validators/tripValidator');
const { tripSearchSchema } = require('../validators/searchValidator');
const {
  reorderCitySchema,
  applyOptimizationSchema,
  selectTransportSchema,
  applyDayOptimizationSchema
} = require('../validators/routeValidator');
const { createSectionSchema, updateSectionSchema, reorderSectionsSchema } = require('../validators/itineraryValidator');
const { createDayActivitySchema, updateDayActivitySchema } = require('../validators/activityValidator');
const { createExpenseSchema } = require('../validators/expenseValidator');
const {
  tripRecommendationSchema,
  budgetOptimizerSchema,
  itinerarySuggestionSchema
} = require('../validators/recommendationValidator');
const {
  inviteCollaboratorSchema,
  updateCollaboratorRoleSchema
} = require('../validators/collaboratorValidator');
const {
  createTemplateSchema,
  duplicateTripSchema
} = require('../validators/templateValidator');
const {
  createSharedExpenseSchema,
  updateSharedExpenseSchema,
  sharedExpenseQuerySchema
} = require('../validators/sharedExpenseValidator');
const {
  createPackingItemSchema,
  updatePackingItemSchema,
  bulkPackingUpdateSchema,
  createTravelDocumentSchema,
  updateTravelDocumentSchema,
  createPreparationTaskSchema,
  updatePreparationTaskSchema
} = require('../validators/preparationValidator');

const router = express.Router();

// Smart Trip Recommendation & Optimization Endpoints (Must be mounted before /:id)
router.post('/recommend', validate(tripRecommendationSchema), recommendationController.getTripRecommendations);
router.post('/optimize-budget', validate(budgetOptimizerSchema), recommendationController.optimizeBudget);
router.post('/suggest-itinerary', authMiddleware, validate(itinerarySuggestionSchema), recommendationController.getItinerarySuggestions);

// Collaborative Trips Shared with Current User (Must be mounted before /:id)
router.get('/shared-with-me', authMiddleware, collaboratorController.getSharedWithMeTrips);

// Advanced User Trip Search (Must be mounted before /:id)
router.get('/search', authMiddleware, validate(tripSearchSchema, 'query'), searchController.searchUserTrips);

// Base Trips
router.get('/', authMiddleware, tripController.getTrips);
router.post('/', authMiddleware, validate(createTripSchema), tripController.createTrip);
router.get('/:id', authMiddleware, tripController.getTripById);
router.put('/:id', authMiddleware, validate(updateTripSchema), tripController.updateTrip);
router.patch('/:id', authMiddleware, validate(updateTripSchema), tripController.updateTrip);
router.delete('/:id', authMiddleware, tripController.deleteTrip);

// Trip Templates & Duplication
router.post('/:tripId/template', authMiddleware, validate(createTemplateSchema), tripTemplateController.createTemplateFromTrip);
router.post('/:tripId/duplicate', authMiddleware, validate(duplicateTripSchema), tripTemplateController.duplicateTrip);

// Trip Health Check & Smart Analysis
router.get('/:tripId/health', authMiddleware, tripController.getTripHealth);

// Trip Specific Insights & Performance
router.get('/:tripId/insights', authMiddleware, analyticsController.getSingleTripInsights);

// Nested Itinerary Sections
router.get('/:tripId/sections', authMiddleware, itineraryController.getTripSections);
router.post('/:tripId/sections', authMiddleware, validate(createSectionSchema), itineraryController.createSection);
router.patch('/:tripId/sections/:sectionId', authMiddleware, validate(updateSectionSchema), (req, res, next) => {
  req.params.id = req.params.sectionId;
  return itineraryController.updateSection(req, res, next);
});
router.delete('/:tripId/sections/:sectionId', authMiddleware, (req, res, next) => {
  req.params.id = req.params.sectionId;
  return itineraryController.deleteSection(req, res, next);
});
router.put('/:tripId/sections/reorder', authMiddleware, validate(reorderSectionsSchema), itineraryController.reorderSections);

// Nested Trip Days
router.get('/:tripId/days', authMiddleware, itineraryController.getTripDays);

// Nested Day Activities
router.post('/:tripId/days/:dayId/activities', authMiddleware, validate(createDayActivitySchema), activityController.assignDayActivity);
router.patch('/:tripId/days/:dayId/activities/:activityId', authMiddleware, validate(updateDayActivitySchema), (req, res, next) => {
  req.params.id = req.params.activityId;
  return activityController.updateDayActivity(req, res, next);
});
router.delete('/:tripId/days/:dayId/activities/:activityId', authMiddleware, (req, res, next) => {
  req.params.id = req.params.activityId;
  return activityController.deleteDayActivity(req, res, next);
});

// Nested Manual & Personal Expenses
router.get('/:tripId/expenses', authMiddleware, expenseController.getTripExpenses);
router.post('/:tripId/expenses', authMiddleware, validate(createExpenseSchema), expenseController.createExpense);

// Group Shared Expenses & Split Engine
router.post('/:tripId/shared-expenses', authMiddleware, validate(createSharedExpenseSchema), groupExpenseController.createSharedExpense);
router.get('/:tripId/shared-expenses', authMiddleware, validate(sharedExpenseQuerySchema, 'query'), groupExpenseController.getSharedExpenses);
router.patch('/:tripId/shared-expenses/:expenseId', authMiddleware, validate(updateSharedExpenseSchema), groupExpenseController.updateSharedExpense);
router.delete('/:tripId/shared-expenses/:expenseId', authMiddleware, groupExpenseController.deleteSharedExpense);

// Group Balances, Settlements & Personal Summary
router.get('/:tripId/balances', authMiddleware, groupExpenseController.getTripBalances);
router.get('/:tripId/settlements', authMiddleware, groupExpenseController.getOptimizedSettlements);
router.get('/:tripId/settlements/history', authMiddleware, groupExpenseController.getSettlementHistory);
router.patch('/:tripId/settlements/:settlementId/complete', authMiddleware, groupExpenseController.completeSettlement);
router.get('/:tripId/my-expense-summary', authMiddleware, groupExpenseController.getMyExpenseSummary);

// Smart Packing Checklist
router.get('/:tripId/packing-list', authMiddleware, tripPreparationController.getPackingList);
router.post('/:tripId/packing-list/items', authMiddleware, validate(createPackingItemSchema), tripPreparationController.addPackingItem);
router.patch('/:tripId/packing-list/items/:itemId', authMiddleware, validate(updatePackingItemSchema), tripPreparationController.updatePackingItem);
router.delete('/:tripId/packing-list/items/:itemId', authMiddleware, tripPreparationController.deletePackingItem);
router.patch('/:tripId/packing-list/bulk', authMiddleware, validate(bulkPackingUpdateSchema), tripPreparationController.bulkUpdatePackingStatus);

// Smart Packing Suggestions
router.get('/:tripId/packing-suggestions', authMiddleware, tripPreparationController.getPackingSuggestions);
router.post('/:tripId/packing-suggestions/:suggestionId/add', authMiddleware, tripPreparationController.addSuggestionToPackingList);

// Travel Documents Checklist
router.get('/:tripId/travel-documents', authMiddleware, tripPreparationController.getTravelDocuments);
router.post('/:tripId/travel-documents', authMiddleware, validate(createTravelDocumentSchema), tripPreparationController.createTravelDocument);
router.patch('/:tripId/travel-documents/:documentId', authMiddleware, validate(updateTravelDocumentSchema), tripPreparationController.updateTravelDocument);
router.delete('/:tripId/travel-documents/:documentId', authMiddleware, tripPreparationController.deleteTravelDocument);

// Pre-Trip Preparation Tasks
router.get('/:tripId/preparation-tasks', authMiddleware, tripPreparationController.getPreparationTasks);
router.post('/:tripId/preparation-tasks', authMiddleware, validate(createPreparationTaskSchema), tripPreparationController.createPreparationTask);
router.patch('/:tripId/preparation-tasks/:taskId', authMiddleware, validate(updatePreparationTaskSchema), tripPreparationController.updatePreparationTask);
router.delete('/:tripId/preparation-tasks/:taskId', authMiddleware, tripPreparationController.deletePreparationTask);

// Trip Readiness Score & Alerts
router.get('/:tripId/readiness', authMiddleware, tripPreparationController.getTripReadiness);

// Nested Budget Analytics
router.get('/:tripId/budget', authMiddleware, budgetController.getTripBudget);

// Nested Trip Sharing
router.post('/:tripId/share', authMiddleware, sharedTripController.shareTrip);
router.delete('/:tripId/share', authMiddleware, sharedTripController.revokeShare);

// Trip Collaborators Management
router.post('/:tripId/collaborators', authMiddleware, validate(inviteCollaboratorSchema), collaboratorController.inviteCollaborator);
router.get('/:tripId/collaborators', authMiddleware, collaboratorController.getCollaborators);
router.patch('/:tripId/collaborators/:userId', authMiddleware, validate(updateCollaboratorRoleSchema), collaboratorController.updateCollaboratorRole);
router.delete('/:tripId/collaborators/:userId', authMiddleware, collaboratorController.removeCollaborator);

// Trip Collaboration Activity Log
router.get('/:tripId/activity-log', authMiddleware, collaboratorController.getActivityLogs);

// Smart Route Planning & Multi-City Optimization
router.get('/:tripId/route', authMiddleware, routeController.getTripRoute);
router.patch('/:tripId/route/reorder', authMiddleware, validate(reorderCitySchema), routeController.reorderTripCities);
router.post('/:tripId/route/optimize', authMiddleware, routeController.getRouteOptimization);
router.post('/:tripId/route/apply-optimization', authMiddleware, validate(applyOptimizationSchema), routeController.applyRouteOptimization);

// Inter-City Travel Segments & Multi-Modal Transport
router.get('/:tripId/travel-segments', authMiddleware, routeController.getTravelSegments);
router.get('/:tripId/travel-segments/:segmentId/options', authMiddleware, routeController.getTravelSegmentOptions);
router.patch('/:tripId/travel-segments/:segmentId', authMiddleware, validate(selectTransportSchema), routeController.selectTransportOption);

// Daily Activity Schedule Optimization
router.post('/:tripId/days/:dayId/optimize', authMiddleware, routeController.optimizeDayActivities);
router.post('/:tripId/days/:dayId/apply-optimization', authMiddleware, validate(applyDayOptimizationSchema), routeController.applyDayOptimization);

// Route Conflicts, Recommendations & Score
router.get('/:tripId/route/conflicts', authMiddleware, routeController.getRouteConflicts);
router.get('/:tripId/route/recommendations', authMiddleware, routeController.getRouteRecommendations);
router.get('/:tripId/route/score', authMiddleware, routeController.getRouteScore);

module.exports = router;
