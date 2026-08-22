const express = require('express');
const activityController = require('../controllers/activityController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  createDayActivitySchema,
  updateDayActivitySchema,
  reorderDayActivitiesSchema
} = require('../validators/activityValidator');

const searchController = require('../controllers/searchController');
const { activitySearchSchema } = require('../validators/searchValidator');

const router = express.Router();

// Master Activity Discovery (Public)
router.get('/activities/search', validate(activitySearchSchema, 'query'), searchController.searchActivities);
router.get('/activities', activityController.getActivities);
router.get('/activities/:id', activityController.getActivityById);

// Day Activity Assignments (Protected)
router.get('/days/:dayId/activities', authMiddleware, activityController.getDayActivities);
router.post('/days/:dayId/activities', authMiddleware, validate(createDayActivitySchema), activityController.assignDayActivity);
router.put('/days/:dayId/activities/reorder', authMiddleware, validate(reorderDayActivitiesSchema), activityController.reorderDayActivities);
router.put('/day-activities/:id', authMiddleware, validate(updateDayActivitySchema), activityController.updateDayActivity);
router.patch('/day-activities/:id', authMiddleware, validate(updateDayActivitySchema), activityController.updateDayActivity);
router.delete('/day-activities/:id', authMiddleware, activityController.deleteDayActivity);

module.exports = router;
