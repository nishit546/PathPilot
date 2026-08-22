const budgetService = require('../services/budgetService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const getTripBudget = asyncHandler(async (req, res) => {
  const budgetAnalytics = await budgetService.getTripBudgetAnalytics(req.params.tripId, req.user.id);
  return sendSuccess(res, 'Trip budget analytics retrieved successfully', budgetAnalytics, 200);
});

module.exports = {
  getTripBudget
};
