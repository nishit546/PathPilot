const express = require('express');
const itineraryController = require('../controllers/itineraryController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { updateSectionSchema } = require('../validators/itineraryValidator');

const router = express.Router();

// Direct section endpoints
router.get('/sections/:id', authMiddleware, itineraryController.getSectionById);
router.put('/sections/:id', authMiddleware, validate(updateSectionSchema), itineraryController.updateSection);
router.delete('/sections/:id', authMiddleware, itineraryController.deleteSection);

// Direct day endpoints
router.get('/sections/:sectionId/days', authMiddleware, itineraryController.getSectionDays);
router.get('/days/:id', authMiddleware, itineraryController.getDayById);

module.exports = router;
