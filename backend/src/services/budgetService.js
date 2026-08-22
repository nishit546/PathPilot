const tripRepository = require('../repositories/tripRepository');
const tripSectionRepository = require('../repositories/tripSectionRepository');
const dayRepository = require('../repositories/dayRepository');
const dayActivityRepository = require('../repositories/dayActivityRepository');
const activityRepository = require('../repositories/activityRepository');
const cityRepository = require('../repositories/cityRepository');
const expenseRepository = require('../repositories/expenseRepository');
const tripAccessService = require('./tripAccessService');
const ApiError = require('../utils/ApiError');

class BudgetService {
  async getTripBudgetAnalytics(tripId, userId) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);

    const expRes = await expenseRepository.findByTripId(trip.id);
    const expenses = Array.isArray(expRes) ? expRes : (expRes && expRes.expenses ? expRes.expenses : []);
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

    // Scheduled activity costs calculation
    let totalActivityCost = 0;
    for (const day of days) {
      const dayActivities = await dayActivityRepository.findByDayId(day.id);
      for (const da of dayActivities) {
        if (da.customCost !== null && da.customCost !== undefined) {
          totalActivityCost += da.customCost;
        } else {
          const master = await activityRepository.findById(da.activityId);
          totalActivityCost += master ? master.estimatedCost : 0;
        }
      }
    }

    // Section breakdown with percentage
    const sectionBreakdown = await Promise.all(
      sections.map(async (section) => {
        const city = await cityRepository.findById(section.cityId);
        const sectionExpenses = expenses.filter(e => String(e.sectionId) === String(section.id));
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
        const dayExpenses = expenses.filter(e => String(e.dayId) === String(day.id));
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
    const estimatedTotalTripCost = totalSpent + totalActivityCost;

    return {
      tripId: trip.id,
      tripName: trip.name,
      totalBudget,
      totalSpent,
      manualExpenses: totalSpent,
      activityEstimatedCost: totalActivityCost,
      estimatedTotalTripCost,
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
