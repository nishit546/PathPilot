const expenseRepository = require('../repositories/expenseRepository');
const tripSectionRepository = require('../repositories/tripSectionRepository');
const dayRepository = require('../repositories/dayRepository');
const tripActivityLogRepository = require('../repositories/tripActivityLogRepository');
const tripAccessService = require('./tripAccessService');
const notificationService = require('./notificationService');
const ApiError = require('../utils/ApiError');

class ExpenseService {
  async getTripExpenses(tripId, userId, query) {
    await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);
    return expenseRepository.findByTripId(tripId, query);
  }

  async createExpense(tripId, userId, data) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR']);

    if (data.sectionId) {
      const section = await tripSectionRepository.findById(data.sectionId);
      if (!section || String(section.tripId) !== String(trip.id)) {
        throw ApiError.badRequest('The specified section does not belong to this trip.');
      }
    }

    if (data.dayId) {
      const day = await dayRepository.findById(data.dayId);
      if (!day || String(day.tripId) !== String(trip.id)) {
        throw ApiError.badRequest('The specified day does not belong to this trip.');
      }
      if (data.sectionId && String(day.sectionId) !== String(data.sectionId)) {
        throw ApiError.badRequest('The specified day does not belong to the specified section.');
      }
    }

    const created = await expenseRepository.create({
      ...data,
      tripId: trip.id
    });

    // Record activity log
    await tripActivityLogRepository.create({
      tripId: trip.id,
      userId,
      action: 'EXPENSE_CREATED',
      description: `Logged expense: ₹${created.amount.toLocaleString()} (${created.category}${created.description ? ` - ${created.description}` : ''})`
    });

    // Check budget limit and trigger warnings
    const expRes = await expenseRepository.findByTripId(trip.id);
    const expList = Array.isArray(expRes) ? expRes : (expRes && expRes.expenses ? expRes.expenses : []);
    const totalSpent = expList.reduce((sum, e) => sum + e.amount, 0);
    await notificationService.checkAndTriggerBudgetAlert(trip.id, totalSpent, trip.totalBudget, userId);

    return created;
  }

  async updateExpense(id, userId, data) {
    const expense = await expenseRepository.findById(id);
    if (!expense) {
      throw ApiError.notFound('Expense not found.');
    }

    const { trip } = await tripAccessService.requirePermission(expense.tripId, userId, ['OWNER', 'EDITOR']);

    const targetSectionId = data.sectionId !== undefined ? data.sectionId : expense.sectionId;
    const targetDayId = data.dayId !== undefined ? data.dayId : expense.dayId;

    if (targetSectionId) {
      const section = await tripSectionRepository.findById(targetSectionId);
      if (!section || String(section.tripId) !== String(trip.id)) {
        throw ApiError.badRequest('The specified section does not belong to this trip.');
      }
    }

    if (targetDayId) {
      const day = await dayRepository.findById(targetDayId);
      if (!day || String(day.tripId) !== String(trip.id)) {
        throw ApiError.badRequest('The specified day does not belong to this trip.');
      }
      if (targetSectionId && String(day.sectionId) !== String(targetSectionId)) {
        throw ApiError.badRequest('The specified day does not belong to the specified section.');
      }
    }

    const updated = await expenseRepository.update(id, data);

    // Record activity log
    await tripActivityLogRepository.create({
      tripId: trip.id,
      userId,
      action: 'EXPENSE_UPDATED',
      description: `Updated expense: ₹${updated.amount.toLocaleString()} (${updated.category})`
    });

    // Check budget limit and trigger warnings
    const allExpenses = await expenseRepository.findByTripId(trip.id);
    const updatedExpList = Array.isArray(allExpenses) ? allExpenses : (allExpenses && allExpenses.expenses ? allExpenses.expenses : []);
    const totalSpent = updatedExpList.reduce((sum, e) => sum + e.amount, 0);
    await notificationService.checkAndTriggerBudgetAlert(trip.id, totalSpent, trip.totalBudget, userId);

    return updated;
  }

  async deleteExpense(id, userId) {
    const expense = await expenseRepository.findById(id);
    if (!expense) {
      throw ApiError.notFound('Expense not found.');
    }

    const { trip } = await tripAccessService.requirePermission(expense.tripId, userId, ['OWNER', 'EDITOR']);

    await expenseRepository.delete(id);

    // Record activity log
    await tripActivityLogRepository.create({
      tripId: trip.id,
      userId,
      action: 'EXPENSE_DELETED',
      description: `Deleted expense: ₹${expense.amount.toLocaleString()} (${expense.category})`
    });

    return { message: 'Expense deleted successfully.' };
  }
}

module.exports = new ExpenseService();
