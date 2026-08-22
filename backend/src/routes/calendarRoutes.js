const express = require('express');
const calendarController = require('../controllers/calendarController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', calendarController.getCalendar);

module.exports = router;
