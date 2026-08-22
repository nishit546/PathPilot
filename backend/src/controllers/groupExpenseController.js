const groupExpenseService = require('../services/groupExpenseService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { buildPaginationMetadata } = require('../utils/pagination');

const createSharedExpense = asyncHandler(async (req, res) => {
  const result = await groupExpenseService.createSharedExpense(req.params.tripId, req.user.id, req.body);
  return sendSuccess(res, 'Shared expense created successfully', result, 201);
});

const getSharedExpenses = asyncHandler(async (req, res) => {
  const result = await groupExpenseService.getSharedExpenses(req.params.tripId, req.user.id, req.query);
  const paginationMeta = buildPaginationMetadata(result.total, result.page, result.limit);
  return sendPaginated(res, 'Shared expenses retrieved successfully', result.expenses, paginationMeta, 200);
});

const updateSharedExpense = asyncHandler(async (req, res) => {
  const result = await groupExpenseService.updateSharedExpense(
    req.params.tripId,
    req.params.expenseId,
    req.user.id,
    req.body
  );
  return sendSuccess(res, 'Shared expense updated successfully', result, 200);
});

const deleteSharedExpense = asyncHandler(async (req, res) => {
  const result = await groupExpenseService.deleteSharedExpense(
    req.params.tripId,
    req.params.expenseId,
    req.user.id
  );
  return sendSuccess(res, result.message, {}, 200);
});

const getTripBalances = asyncHandler(async (req, res) => {
  const result = await groupExpenseService.getTripBalances(req.params.tripId, req.user.id);
  return sendSuccess(res, 'Trip member balances calculated successfully', result, 200);
});

const getOptimizedSettlements = asyncHandler(async (req, res) => {
  const result = await groupExpenseService.getOptimizedSettlements(req.params.tripId, req.user.id);
  return sendSuccess(res, 'Optimized settlements generated successfully', result, 200);
});

const getSettlementHistory = asyncHandler(async (req, res) => {
  const result = await groupExpenseService.getSettlementHistory(req.params.tripId, req.user.id, req.query);
  const paginationMeta = buildPaginationMetadata(result.total, result.page, result.limit);
  return sendPaginated(res, 'Settlement history retrieved successfully', result.settlements, paginationMeta, 200);
});

const completeSettlement = asyncHandler(async (req, res) => {
  const result = await groupExpenseService.completeSettlement(
    req.params.tripId,
    req.params.settlementId,
    req.user.id,
    req.body
  );
  return sendSuccess(res, 'Settlement marked as completed', { settlement: result }, 200);
});

const getMyExpenseSummary = asyncHandler(async (req, res) => {
  const result = await groupExpenseService.getMyExpenseSummary(req.params.tripId, req.user.id);
  return sendSuccess(res, 'Personal expense summary retrieved successfully', result, 200);
});

module.exports = {
  createSharedExpense,
  getSharedExpenses,
  updateSharedExpense,
  deleteSharedExpense,
  getTripBalances,
  getOptimizedSettlements,
  getSettlementHistory,
  completeSettlement,
  getMyExpenseSummary
};
