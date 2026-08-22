const tripRepository = require('../repositories/tripRepository');
const tripSectionRepository = require('../repositories/tripSectionRepository');
const dayRepository = require('../repositories/dayRepository');
const dayActivityRepository = require('../repositories/dayActivityRepository');
const activityRepository = require('../repositories/activityRepository');
const cityRepository = require('../repositories/cityRepository');
const expenseRepository = require('../repositories/expenseRepository');
const ApiError = require('../utils/ApiError');

class BudgetService {
  async getTripBudgetAnalytics(tripId, userId) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      throw ApiError.notFound('Trip not found.');
    }

    if (trip.visibility === 'PRIVATE' && (!userId || trip.userId !== Number(userId))) {
      throw ApiError.forbidden('You do not have permission to view budget analytics for this trip.');
    }

    const expenses = await expenseRepository.findByTripId(trip.id);
    const sections = await tripSectionRepository.findByTripId(trip.id);
    const days = await dayRepository.findByTripId(trip.id);

    // Category breakdown
    const breakdown = {
      TRANSPORT: 0,
      STAY: 0,
      FOOD: 0,
      ACTIVITY: 0,
      OTHER: 0
    };

    let totalSpent = 0;
    expenses.forEach(e => {
      const cat = e.category || 'OTHER';
      if (breakdown[cat] !== undefined) {
        breakdown[cat] += e.amount;
      } else {
        breakdown.OTHER += e.amount;
      }
      totalSpent += e.amount;
    });

    // Section breakdown with percentage
    const sectionBreakdown = await Promise.all(
      sections.map(async (section) => {
        const city = await cityRepository.findById(section.cityId);
        const sectionExpenses = expenses.filter(e => e.sectionId === section.id);
        const sectionSpent = sectionExpenses.reduce((sum, e) => sum + e.amount, 0);
        const sectionBudget = section.budget || 0;
        const sectionRemaining = sectionBudget - sectionSpent;
        const sectionPercentageUsed = sectionBudget > 0 ? Math.round((sectionSpent / sectionBudget) * 10000) / 100 : 0;

        return {
          sectionId: section.id,
          cityId: section.cityId,
          cityName: city ? city.name : 'Unknown City',
          startDate: section.startDate,
          endDate: section.endDate,
          budget: sectionBudget,
          spent: sectionSpent,
          remaining: sectionRemaining,
          percentageUsed: sectionPercentageUsed
        };
      })
    );

    // Day breakdown
    const dayBreakdown = await Promise.all(
      days.map(async (day) => {
        const dayExpenses = expenses.filter(e => e.dayId === day.id);
        const dayExpenseTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

        const dayActivities = await dayActivityRepository.findByDayId(day.id);
        let dayActivityTotal = 0;
        for (const da of dayActivities) {
          if (da.customCost !== null && da.customCost !== undefined) {
            dayActivityTotal += da.customCost;
          } else {
            const master = await activityRepository.findById(da.activityId);
            dayActivityTotal += master ? master.estimatedCost : 0;
          }
        }

        return {
          dayId: day.id,
          sectionId: day.sectionId,
          date: day.date,
          dayNumber: day.dayNumber,
          expenseTotal: dayExpenseTotal,
          activityEstimatedTotal: dayActivityTotal,
          totalDayCost: dayExpenseTotal + dayActivityTotal
        };
      })
    );

    // Calculate total days safely
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const timeDiff = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1);

    const totalBudget = trip.totalBudget || 0;
    const remainingBudget = totalBudget - totalSpent;
    const percentageUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 10000) / 100 : 0;
    const averageCostPerDay = totalDays > 0 ? Math.round((totalSpent / totalDays) * 100) / 100 : 0;

    return {
      tripId: trip.id,
      tripName: trip.name,
      totalBudget,
      totalSpent,
      estimatedSpent: totalSpent,
      remainingBudget,
      percentageUsed,
      totalDays,
      averageCostPerDay,
      categoryBreakdown: breakdown,
      breakdown,
      sectionBreakdown,
      dayBreakdown
    };
  }
}

module.exports = new BudgetService();
