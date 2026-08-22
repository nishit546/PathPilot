const express = require('express');
const budgetController = require('../controllers/budgetController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/trips/:tripId/budget', authMiddleware, budgetController.getTripBudget);

module.exports = router;
