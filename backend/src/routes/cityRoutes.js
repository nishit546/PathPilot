const express = require('express');
const cityController = require('../controllers/cityController');
const activityController = require('../controllers/activityController');

const searchController = require('../controllers/searchController');
const { validate } = require('../middleware/validationMiddleware');
const { citySearchSchema } = require('../validators/searchValidator');

const router = express.Router();

// Public City Discovery Routes
router.get('/search', validate(citySearchSchema, 'query'), searchController.searchCities);
router.get('/', cityController.getCities);
router.get('/:id', cityController.getCityById);

// Nested activities for a specific city
router.get('/:id/activities', (req, res, next) => {
  req.query.cityId = req.params.id;
  return activityController.getActivities(req, res, next);
});

module.exports = router;
