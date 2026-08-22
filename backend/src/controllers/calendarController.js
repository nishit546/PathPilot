const calendarService = require('../services/calendarService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const getCalendar = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const calendarItems = await calendarService.getUserCalendarTrips(req.user.id, { month, year });
  return sendSuccess(res, 'User calendar trips retrieved successfully', { trips: calendarItems, count: calendarItems.length }, 200);
});

module.exports = {
  getCalendar
};
