const expenseService = require('../services/expenseService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const getTripExpenses = asyncHandler(async (req, res) => {
  const { category, sectionId, dayId } = req.query;
  const expenses = await expenseService.getTripExpenses(req.params.tripId, req.user.id, { category, sectionId, dayId });
  return sendSuccess(res, 'Trip expenses retrieved successfully', { expenses, count: expenses.length }, 200);
});

const createExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.createExpense(req.params.tripId, req.user.id, req.body);
  return sendSuccess(res, 'Expense logged successfully', { expense }, 201);
});

const updateExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.updateExpense(req.params.id, req.user.id, req.body);
  return sendSuccess(res, 'Expense updated successfully', { expense }, 200);
});

const deleteExpense = asyncHandler(async (req, res) => {
  const result = await expenseService.deleteExpense(req.params.id, req.user.id);
  return sendSuccess(res, result.message, {}, 200);
});

module.exports = {
  getTripExpenses,
  createExpense,
  updateExpense,
  deleteExpense
};
