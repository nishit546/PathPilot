const express = require('express');
const tripController = require('../controllers/tripController');
const itineraryController = require('../controllers/itineraryController');
const expenseController = require('../controllers/expenseController');
const budgetController = require('../controllers/budgetController');
const sharedTripController = require('../controllers/sharedTripController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { createTripSchema, updateTripSchema } = require('../validators/tripValidator');
const { createSectionSchema, reorderSectionsSchema } = require('../validators/itineraryValidator');
const { createExpenseSchema } = require('../validators/expenseValidator');

const router = express.Router();

// Base Trips
router.get('/', authMiddleware, tripController.getTrips);
router.post('/', authMiddleware, validate(createTripSchema), tripController.createTrip);
router.get('/:id', authMiddleware, tripController.getTripById);
router.put('/:id', authMiddleware, validate(updateTripSchema), tripController.updateTrip);
router.delete('/:id', authMiddleware, tripController.deleteTrip);

// Nested Itinerary Sections
router.get('/:tripId/sections', authMiddleware, itineraryController.getTripSections);
router.post('/:tripId/sections', authMiddleware, validate(createSectionSchema), itineraryController.createSection);
router.put('/:tripId/sections/reorder', authMiddleware, validate(reorderSectionsSchema), itineraryController.reorderSections);

// Nested Expenses
router.get('/:tripId/expenses', authMiddleware, expenseController.getTripExpenses);
router.post('/:tripId/expenses', authMiddleware, validate(createExpenseSchema), expenseController.createExpense);

// Nested Budget Analytics
router.get('/:tripId/budget', authMiddleware, budgetController.getTripBudget);

// Nested Trip Sharing
router.post('/:tripId/share', authMiddleware, sharedTripController.shareTrip);
router.delete('/:tripId/share', authMiddleware, sharedTripController.revokeShare);

module.exports = router;
