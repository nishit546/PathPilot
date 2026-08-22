const tripRepository = require('../repositories/tripRepository');
const tripSectionRepository = require('../repositories/tripSectionRepository');
const dayRepository = require('../repositories/dayRepository');
const dayActivityRepository = require('../repositories/dayActivityRepository');
const activityRepository = require('../repositories/activityRepository');
const cityRepository = require('../repositories/cityRepository');
const expenseRepository = require('../repositories/expenseRepository');
const tripAccessService = require('./tripAccessService');
const notificationService = require('./notificationService');

class TripHealthService {
  async analyzeTripHealth(tripId, userId, query = {}) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);

    let score = 100;
    const issues = [];
    const suggestions = [];

    const sections = await tripSectionRepository.findByTripId(trip.id);
    const days = await dayRepository.findByTripId(trip.id);
    const expRes = await expenseRepository.findByTripId(trip.id);
    const expenses = Array.isArray(expRes) ? expRes : (expRes && expRes.expenses ? expRes.expenses : []);

    let totalActivities = 0;
    const activityCategories = new Set();

    // 1. Evaluate Itinerary Days
    for (const day of days) {
      const dayActivities = await dayActivityRepository.findByDayId(day.id);
      totalActivities += dayActivities.length;

      for (const da of dayActivities) {
        const meta = await activityRepository.findById(da.activityId);
        if (meta && meta.category) {
          activityCategories.add(meta.category.toUpperCase());
        }
      }

      if (dayActivities.length === 0) {
        score -= 10;
        issues.push({
          type: 'EMPTY_DAY',
          severity: 'MEDIUM',
          message: `Day ${day.dayNumber} (${day.date}) has no activities planned.`,
          dayId: day.id,
          date: day.date
        });
        suggestions.push(`Explore top city attractions and add at least 1 activity to Day ${day.dayNumber}.`);
      } else if (dayActivities.length > 3) {
        score -= 5;
        issues.push({
          type: 'OVERLOADED_DAY',
          severity: 'LOW',
          message: `Day ${day.dayNumber} (${day.date}) has ${dayActivities.length} activities scheduled (potential rush).`,
          dayId: day.id,
          date: day.date
        });
        suggestions.push(`Consider spacing out activities on Day ${day.dayNumber} for a more relaxed itinerary.`);
      }
    }

    // 2. Entire Trip Activity Feasibility
    if (days.length > 0 && totalActivities === 0) {
      score -= 15;
      issues.push({
        type: 'NO_ACTIVITIES',
        severity: 'HIGH',
        message: 'No activities scheduled for the entire trip.'
      });
      suggestions.push('Use the Smart Recommendation engine to auto-generate personalized activities.');
    }

    // 3. Evaluate Destination Sections
    for (const section of sections) {
      const city = await cityRepository.findById(section.cityId);
      const sectionDays = await dayRepository.findBySectionId(section.id);
      let sectionActivityCount = 0;

      for (const sd of sectionDays) {
        const acts = await dayActivityRepository.findByDayId(sd.id);
        sectionActivityCount += acts.length;
      }

      if (sectionActivityCount === 0 && sectionDays.length > 0) {
        score -= 8;
        issues.push({
          type: 'EMPTY_SECTION',
          severity: 'MEDIUM',
          message: `Destination stop "${city ? city.name : 'Unknown City'}" has no scheduled activities.`,
          sectionId: section.id
        });
        suggestions.push(`Add recommended sightseeing stops in ${city ? city.name : 'your destination'}.`);
      }
    }

    // 4. Evaluate Budget Health
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalBudget = trip.totalBudget || 0;

    if (totalBudget > 0) {
      const percentageUsed = (totalSpent / totalBudget) * 100;

      if (totalSpent > totalBudget) {
        score -= 20;
        const overage = totalSpent - totalBudget;
        issues.push({
          type: 'BUDGET_EXCEEDED',
          severity: 'HIGH',
          message: `Trip expenditures (₹${totalSpent.toLocaleString()}) exceed budget (₹${totalBudget.toLocaleString()}) by ₹${overage.toLocaleString()}.`,
          totalBudget,
          totalSpent,
          overage
        });
        suggestions.push('Use the Budget Optimizer to review high-cost items or adjust your spending limit.');
      } else if (percentageUsed >= 80) {
        score -= 10;
        issues.push({
          type: 'BUDGET_WARNING',
          severity: 'MEDIUM',
          message: `${Math.round(percentageUsed)}% of total trip budget has been utilized (₹${totalSpent.toLocaleString()} of ₹${totalBudget.toLocaleString()}).`,
          totalBudget,
          totalSpent
        });
        suggestions.push('Track upcoming expenses closely to avoid exceeding your budget ceiling.');
      }
    }

    // Clamping final score
    const finalScore = Math.max(0, Math.min(100, score));

    // Status rating
    let status = 'EXCELLENT';
    if (finalScore < 50) {
      status = 'CRITICAL';
    } else if (finalScore < 75) {
      status = 'NEEDS_ATTENTION';
    } else if (finalScore < 90) {
      status = 'GOOD';
    }

    // Smart Alert Generation on severe health issues
    if (query.triggerAlerts !== 'false' && issues.length > 0) {
      const emptyDayIssue = issues.find((i) => i.type === 'EMPTY_DAY');
      if (emptyDayIssue) {
        await notificationService.createNotification({
          userId,
          type: 'EMPTY_DAY',
          title: 'Empty Itinerary Day Detected',
          message: emptyDayIssue.message,
          relatedTripId: trip.id,
          metadata: { dayId: emptyDayIssue.dayId, date: emptyDayIssue.date },
          preventDuplicate: true
        });
      }

      const budgetExceededIssue = issues.find((i) => i.type === 'BUDGET_EXCEEDED');
      if (budgetExceededIssue) {
        await notificationService.createNotification({
          userId,
          type: 'BUDGET_EXCEEDED',
          title: 'Trip Budget Limit Exceeded',
          message: budgetExceededIssue.message,
          relatedTripId: trip.id,
          metadata: { totalBudget, totalSpent },
          preventDuplicate: true
        });
      }
    }

    return {
      tripId: trip.id,
      tripName: trip.name,
      score: finalScore,
      status,
      issuesCount: issues.length,
      issues,
      suggestions
    };
  }
}

module.exports = new TripHealthService();
