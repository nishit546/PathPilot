const express = require('express');
const sharedTripController = require('../controllers/sharedTripController');
const tripTemplateController = require('../controllers/tripTemplateController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public Read-Only shared trip viewer
router.get('/:shareToken', sharedTripController.getSharedTrip);

// Copy Public Shared Trip into personal account
router.post('/:shareToken/copy', authMiddleware, tripTemplateController.copySharedTrip);

module.exports = router;
