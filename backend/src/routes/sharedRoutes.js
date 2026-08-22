const express = require('express');
const sharedTripController = require('../controllers/sharedTripController');

const router = express.Router();

// Public Read-Only shared trip viewer
router.get('/:shareToken', sharedTripController.getSharedTrip);

module.exports = router;
