const expenseRepository = require('../repositories/expenseRepository');
const tripRepository = require('../repositories/tripRepository');
const tripSectionRepository = require('../repositories/tripSectionRepository');
const dayRepository = require('../repositories/dayRepository');
const ApiError = require('../utils/ApiError');

class ExpenseService {
  async getTripExpenses(tripId, userId, filters) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      throw ApiError.notFound('Trip not found.');
    }

    if (trip.visibility === 'PRIVATE' && (!userId || trip.userId !== Number(userId))) {
      throw ApiError.forbidden('You do not have access to this trip’s expenses.');
    }

    return expenseRepository.findByTripId(tripId, filters);
  }

  async createExpense(tripId, userId, data) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      throw ApiError.notFound('Trip not found.');
    }

    if (trip.userId !== Number(userId)) {
      throw ApiError.forbidden('You do not have permission to log expenses for this trip.');
    }

    if (data.sectionId) {
      const section = await tripSectionRepository.findById(data.sectionId);
      if (!section || section.tripId !== trip.id) {
        throw ApiError.badRequest('The specified section does not belong to this trip.');
      }
    }

    if (data.dayId) {
      const day = await dayRepository.findById(data.dayId);
      if (!day || day.tripId !== trip.id) {
        throw ApiError.badRequest('The specified day does not belong to this trip.');
      }
      if (data.sectionId && day.sectionId !== Number(data.sectionId)) {
        throw ApiError.badRequest('The specified day does not belong to the specified section.');
      }
    }

    const created = await expenseRepository.create({
      ...data,
      tripId: trip.id
    });

    return created;
  }

  async updateExpense(id, userId, data) {
    const expense = await expenseRepository.findById(id);
    if (!expense) {
      throw ApiError.notFound('Expense not found.');
    }

    const trip = await tripRepository.findById(expense.tripId);
    if (trip.userId !== Number(userId)) {
      throw ApiError.forbidden('You do not have permission to edit this expense.');
    }

    const targetSectionId = data.sectionId !== undefined ? data.sectionId : expense.sectionId;
    const targetDayId = data.dayId !== undefined ? data.dayId : expense.dayId;

    if (targetSectionId) {
      const section = await tripSectionRepository.findById(targetSectionId);
      if (!section || section.tripId !== trip.id) {
        throw ApiError.badRequest('The specified section does not belong to this trip.');
      }
    }

    if (targetDayId) {
      const day = await dayRepository.findById(targetDayId);
      if (!day || day.tripId !== trip.id) {
        throw ApiError.badRequest('The specified day does not belong to this trip.');
      }
      if (targetSectionId && day.sectionId !== Number(targetSectionId)) {
        throw ApiError.badRequest('The specified day does not belong to the specified section.');
      }
    }

    const updated = await expenseRepository.update(id, data);
    return updated;
  }

  async deleteExpense(id, userId) {
    const expense = await expenseRepository.findById(id);
    if (!expense) {
      throw ApiError.notFound('Expense not found.');
    }

    const trip = await tripRepository.findById(expense.tripId);
    if (trip.userId !== Number(userId)) {
      throw ApiError.forbidden('You do not have permission to delete this expense.');
    }

    await expenseRepository.delete(id);
    return { message: 'Expense deleted successfully.' };
  }
}

module.exports = new ExpenseService();
