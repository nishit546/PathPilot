const tripRepository = require('../repositories/tripRepository');
const tripCollaboratorRepository = require('../repositories/tripCollaboratorRepository');
const tripSectionRepository = require('../repositories/tripSectionRepository');
const dayRepository = require('../repositories/dayRepository');
const dayActivityRepository = require('../repositories/dayActivityRepository');
const activityRepository = require('../repositories/activityRepository');
const cityRepository = require('../repositories/cityRepository');
const expenseRepository = require('../repositories/expenseRepository');
const sharedExpenseRepository = require('../repositories/sharedExpenseRepository');
const packingRepository = require('../repositories/packingRepository');
const tripAccessService = require('./tripAccessService');
const tripHealthService = require('./tripHealthService');
const tripPreparationService = require('./tripPreparationService');
const budgetService = require('./budgetService');
const { getTripStatus, getDurationInDays, getDateRange } = require('../utils/analyticsCalculator');
const { evaluateAchievements } = require('../utils/achievementCalculator');
const { generateInsights } = require('../utils/insightGenerator');
const ApiError = require('../utils/ApiError');

class AnalyticsService {
  /**
   * Helper to retrieve all accessible trips for a user (owned + collaborated).
   */
  async _getUserAccessibleTrips(userId) {
    const tripRes = await tripRepository.findByUserId(userId, { limit: 1000 });
    const ownedTrips = tripRes && tripRes.trips ? tripRes.trips : [];
    const collaborations = await tripCollaboratorRepository.findByUserId(userId);

    const collabTripIds = collaborations.map((c) => c.tripId);
    const collabTrips = [];
    for (const tId of collabTripIds) {
      if (!ownedTrips.some((t) => t.id === tId)) {
        const tr = await tripRepository.findById(tId);
        if (tr) collabTrips.push(tr);
      }
    }

    return [...ownedTrips, ...collabTrips];
  }

  /**
   * 1. Personal Travel Dashboard Overview
   */
  async getUserDashboard(userId) {
    const trips = await this._getUserAccessibleTrips(userId);
    const totalTrips = trips.length;

    if (totalTrips === 0) {
      return {
        totalTrips: 0,
        upcomingTrips: 0,
        ongoingTrips: 0,
        completedTrips: 0,
        totalCitiesVisited: 0,
        totalEstimatedSpent: 0,
        averageTripDuration: 0,
        averageTripCost: 0,
        favoriteActivityCategory: null,
        mostVisitedCity: null
      };
    }

    let upcomingTrips = 0;
    let ongoingTrips = 0;
    let completedTrips = 0;
    let totalDurationDays = 0;
    let totalEstimatedSpent = 0;

    const cityVisitMap = new Map(); // cityId -> { name, count }
    const activityCategoryMap = new Map(); // category -> count

    for (const trip of trips) {
      const status = getTripStatus(trip.startDate, trip.endDate);
      if (status === 'UPCOMING') upcomingTrips++;
      else if (status === 'ONGOING') ongoingTrips++;
      else completedTrips++;

      const duration = getDurationInDays(trip.startDate, trip.endDate);
      totalDurationDays += duration;

      // Expenses
      const expenses = await expenseRepository.findByTripId(trip.id);
      const tripSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      totalEstimatedSpent += tripSpent;

      // Sections & Cities
      const sections = await tripSectionRepository.findByTripId(trip.id);
      for (const s of sections) {
        if (s.cityId) {
          const cityMeta = await cityRepository.findById(s.cityId);
          const cityName = cityMeta ? cityMeta.name : `City #${s.cityId}`;
          const current = cityVisitMap.get(s.cityId) || { id: s.cityId, name: cityName, visitCount: 0 };
          current.visitCount++;
          cityVisitMap.set(s.cityId, current);
        }

        // Activities
        const days = await dayRepository.findBySectionId(s.id);
        for (const d of days) {
          const dayActs = await dayActivityRepository.findByDayId(d.id);
          for (const da of dayActs) {
            const actMeta = await activityRepository.findById(da.activityId);
            const cat = actMeta?.category ? actMeta.category.toUpperCase() : 'OTHER';
            activityCategoryMap.set(cat, (activityCategoryMap.get(cat) || 0) + 1);
          }
        }
      }
    }

    const averageTripDuration = Math.round((totalDurationDays / totalTrips) * 10) / 10;
    const averageTripCost = Math.round(totalEstimatedSpent / totalTrips);

    // Favorite Activity Category
    let favoriteActivityCategory = null;
    let maxCatCount = 0;
    for (const [cat, count] of activityCategoryMap.entries()) {
      if (count > maxCatCount) {
        maxCatCount = count;
        favoriteActivityCategory = cat;
      }
    }

    // Most Visited City
    let mostVisitedCity = null;
    let maxCityVisits = 0;
    for (const [, cityObj] of cityVisitMap.entries()) {
      if (cityObj.visitCount > maxCityVisits) {
        maxCityVisits = cityObj.visitCount;
        mostVisitedCity = cityObj;
      }
    }

    return {
      totalTrips,
      upcomingTrips,
      ongoingTrips,
      completedTrips,
      totalCitiesVisited: cityVisitMap.size,
      totalEstimatedSpent,
      averageTripDuration,
      averageTripCost,
      favoriteActivityCategory,
      mostVisitedCity
    };
  }

  /**
   * 2. Spending Analytics with flexible chart groupings
   */
  async getSpendingAnalytics(userId, query = {}) {
    const accessibleTrips = await this._getUserAccessibleTrips(userId);
    let targetTrips = accessibleTrips;

    if (query.tripId) {
      const trip = accessibleTrips.find((t) => t.id === Number(query.tripId));
      if (!trip) {
        throw ApiError.forbidden('You do not have access to spending analytics for this trip.');
      }
      targetTrips = [trip];
    }

    // Collect expenses across target trips
    let allExpenses = [];
    for (const t of targetTrips) {
      const exps = await expenseRepository.findByTripId(t.id);
      const expsWithTrip = exps.map((e) => ({ ...e, tripName: t.name, tripStartDate: t.startDate }));
      allExpenses.push(...expsWithTrip);
    }

    // Apply date range filters if provided
    if (query.startDate) {
      allExpenses = allExpenses.filter((e) => (e.expenseDate || e.createdAt) >= query.startDate);
    }
    if (query.endDate) {
      allExpenses = allExpenses.filter((e) => (e.expenseDate || e.createdAt) <= query.endDate);
    }

    const totalSpent = allExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // Calculate total active travel days
    let totalDays = 0;
    for (const t of targetTrips) {
      totalDays += getDurationInDays(t.startDate, t.endDate);
    }
    const averageDailyCost = totalDays > 0 ? Math.round(totalSpent / totalDays) : totalSpent;

    // Highest single expense
    let highestExpense = null;
    if (allExpenses.length > 0) {
      const sorted = [...allExpenses].sort((a, b) => b.amount - a.amount);
      highestExpense = {
        name: sorted[0].description || sorted[0].category,
        category: sorted[0].category,
        amount: Number(sorted[0].amount)
      };
    }

    // Grouping breakdown (DAY, MONTH, CATEGORY, TRIP, CITY)
    const groupBy = (query.groupBy || 'CATEGORY').toUpperCase();
    const groupMap = new Map();

    for (const e of allExpenses) {
      let key = 'OTHER';
      if (groupBy === 'CATEGORY') {
        key = e.category || 'OTHER';
      } else if (groupBy === 'MONTH') {
        const d = e.expenseDate || e.createdAt || e.tripStartDate;
        key = d ? d.substring(0, 7) : 'Unknown Month'; // YYYY-MM
      } else if (groupBy === 'DAY') {
        const d = e.expenseDate || e.createdAt;
        key = d ? d.substring(0, 10) : 'Unknown Day'; // YYYY-MM-DD
      } else if (groupBy === 'TRIP') {
        key = e.tripName || `Trip #${e.tripId}`;
      } else if (groupBy === 'CITY') {
        key = e.cityName || 'General / Unallocated';
      }

      groupMap.set(key, (groupMap.get(key) || 0) + Number(e.amount));
    }

    const breakdown = [];
    for (const [label, amount] of groupMap.entries()) {
      breakdown.push({
        label,
        amount,
        percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0
      });
    }

    // Sort breakdown by amount descending
    breakdown.sort((a, b) => b.amount - a.amount);

    return {
      totalSpent,
      averageDailyCost,
      highestExpense,
      groupBy,
      breakdown
    };
  }

  /**
   * 3. Travel Activity Insights
   */
  async getActivityInsights(userId) {
    const trips = await this._getUserAccessibleTrips(userId);
    const categoryCountMap = new Map();
    let totalActivities = 0;
    let totalActivityCost = 0;
    let mostExpensiveActivity = null;

    for (const trip of trips) {
      const sections = await tripSectionRepository.findByTripId(trip.id);
      for (const s of sections) {
        const days = await dayRepository.findBySectionId(s.id);
        for (const d of days) {
          const dayActs = await dayActivityRepository.findByDayId(d.id);
          for (const da of dayActs) {
            totalActivities++;
            const actMeta = await activityRepository.findById(da.activityId);
            const cost = Number(da.customCost !== undefined && da.customCost !== null ? da.customCost : (actMeta?.cost || 0));
            totalActivityCost += cost;

            const cat = actMeta?.category ? actMeta.category.toUpperCase() : 'OTHER';
            categoryCountMap.set(cat, (categoryCountMap.get(cat) || 0) + 1);

            const actName = actMeta?.name || `Activity #${da.activityId}`;
            if (!mostExpensiveActivity || cost > mostExpensiveActivity.cost) {
              mostExpensiveActivity = {
                name: actName,
                cost,
                category: cat
              };
            }
          }
        }
      }
    }

    const favoriteCategories = [];
    for (const [category, count] of categoryCountMap.entries()) {
      favoriteCategories.push({
        category,
        count,
        percentage: totalActivities > 0 ? Math.round((count / totalActivities) * 100) : 0
      });
    }
    favoriteCategories.sort((a, b) => b.count - a.count);

    return {
      totalActivities,
      averageActivityCost: totalActivities > 0 ? Math.round(totalActivityCost / totalActivities) : 0,
      favoriteCategories,
      mostExpensiveActivity: mostExpensiveActivity || { name: 'None', cost: 0 }
    };
  }

  /**
   * 4. City Insights
   */
  async getCityInsights(userId) {
    const trips = await this._getUserAccessibleTrips(userId);
    const cityVisitMap = new Map(); // cityId -> { city, count }
    const cityPlannedMap = new Map();
    const citySpendMap = new Map(); // cityId -> { city, totalCost }

    for (const trip of trips) {
      const status = getTripStatus(trip.startDate, trip.endDate);
      const sections = await tripSectionRepository.findByTripId(trip.id);

      for (const s of sections) {
        if (s.cityId) {
          const cityMeta = await cityRepository.findById(s.cityId);
          const cityName = cityMeta ? cityMeta.name : `City #${s.cityId}`;

          if (status === 'COMPLETED' || status === 'ONGOING') {
            const current = cityVisitMap.get(s.cityId) || { id: s.cityId, city: cityName, count: 0 };
            current.count++;
            cityVisitMap.set(s.cityId, current);
          } else {
            const current = cityPlannedMap.get(s.cityId) || { id: s.cityId, city: cityName, count: 0 };
            current.count++;
            cityPlannedMap.set(s.cityId, current);
          }

          // Compute activities cost in section
          let sectionCost = Number(s.budget || 0);
          const days = await dayRepository.findBySectionId(s.id);
          for (const d of days) {
            const dayActs = await dayActivityRepository.findByDayId(d.id);
            for (const da of dayActs) {
              const actMeta = await activityRepository.findById(da.activityId);
              sectionCost += Number(da.customCost || actMeta?.cost || 0);
            }
          }

          const currentSpend = citySpendMap.get(s.cityId) || { id: s.cityId, city: cityName, totalCost: 0 };
          currentSpend.totalCost += sectionCost;
          citySpendMap.set(s.cityId, currentSpend);
        }
      }
    }

    const mostVisited = Array.from(cityVisitMap.values()).sort((a, b) => b.count - a.count);
    const mostPlanned = Array.from(cityPlannedMap.values()).sort((a, b) => b.count - a.count);
    const spendingList = Array.from(citySpendMap.values()).sort((a, b) => b.totalCost - a.totalCost);

    const mostExpensive = spendingList.length > 0 ? spendingList[spendingList.length - 1] : { city: 'None', totalCost: 0 };
    const cheapestCity = spendingList.length > 0 ? spendingList[0] : { city: 'None', totalCost: 0 };
    const totalCities = citySpendMap.size;
    const totalCitySpent = spendingList.reduce((sum, c) => sum + c.totalCost, 0);

    return {
      mostVisited,
      mostPlanned,
      mostExpensive,
      cheapestCity,
      averageCostPerCity: totalCities > 0 ? Math.round(totalCitySpent / totalCities) : 0
    };
  }

  /**
   * 5. Travel Timeline Analytics
   */
  async getTravelTimeline(userId, query = {}) {
    const trips = await this._getUserAccessibleTrips(userId);
    const targetYear = query.year ? Number(query.year) : new Date().getFullYear();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const timelineData = monthNames.map((m) => ({
      month: m,
      trips: 0,
      daysTravelled: 0,
      estimatedSpent: 0
    }));

    for (const trip of trips) {
      const tripYear = new Date(trip.startDate).getFullYear();
      if (!query.year || tripYear === targetYear) {
        const monthIndex = new Date(trip.startDate).getMonth();
        const duration = getDurationInDays(trip.startDate, trip.endDate);

        const expenses = await expenseRepository.findByTripId(trip.id);
        const spent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

        timelineData[monthIndex].trips += 1;
        timelineData[monthIndex].daysTravelled += duration;
        timelineData[monthIndex].estimatedSpent += spent;
      }
    }

    return timelineData;
  }

  /**
   * 6. Multi-Trip Comparison Engine (Up to 5 Trips)
   */
  async compareTrips(userId, tripIds) {
    const results = [];

    for (const tId of tripIds) {
      const { trip } = await tripAccessService.requirePermission(tId, userId, ['OWNER', 'EDITOR', 'VIEWER']);

      const duration = getDurationInDays(trip.startDate, trip.endDate);
      const budgetAnalysis = await budgetService.getTripBudgetAnalytics(trip.id, userId);
      const expenses = await expenseRepository.findByTripId(trip.id);
      const actualExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

      const sections = await tripSectionRepository.findByTripId(trip.id);
      let activitiesCount = 0;
      for (const s of sections) {
        const days = await dayRepository.findBySectionId(s.id);
        for (const d of days) {
          const acts = await dayActivityRepository.findByDayId(d.id);
          activitiesCount += acts.length;
        }
      }

      const health = await tripHealthService.analyzeTripHealth(trip.id, userId);
      const readiness = await tripPreparationService.getTripReadiness(trip.id, userId, false);

      results.push({
        tripId: trip.id,
        name: trip.name,
        duration,
        budget: Number(trip.totalBudget || 0),
        estimatedCost: budgetAnalysis.estimatedTotalTripCost,
        actualExpenses,
        costPerDay: duration > 0 ? Math.round(budgetAnalysis.estimatedTotalTripCost / duration) : 0,
        cities: sections.length,
        activities: activitiesCount,
        healthScore: health.score !== undefined ? health.score : (health.healthScore || 0),
        readinessScore: readiness.score
      });
    }

    return { trips: results };
  }

  /**
   * 7. Smart Travel Insights (Deterministic Behavioral Rules)
   */
  async getSmartInsights(userId) {
    const dashboard = await this.getUserDashboard(userId);
    const spending = await this.getSpendingAnalytics(userId);
    const activities = await this.getActivityInsights(userId);
    const cities = await this.getCityInsights(userId);

    const insights = generateInsights({
      tripsSummary: dashboard,
      spendingSummary: spending,
      activitiesSummary: activities,
      citiesSummary: cities
    });

    return {
      totalInsights: insights.length,
      insights
    };
  }

  /**
   * 8. Dynamic Travel Achievements
   */
  async getAchievements(userId) {
    const trips = await this._getUserAccessibleTrips(userId);
    const dashboard = await this.getUserDashboard(userId);

    let adventureCount = 0;
    let tripsWithinBudget = 0;
    let hasEarlyPlanned = false;
    let hasPerfectPacking = false;

    const today = new Date().toISOString().split('T')[0];

    for (const t of trips) {
      // Check adventure activities
      const sections = await tripSectionRepository.findByTripId(t.id);
      for (const s of sections) {
        const days = await dayRepository.findBySectionId(s.id);
        for (const d of days) {
          const dayActs = await dayActivityRepository.findByDayId(d.id);
          for (const da of dayActs) {
            const meta = await activityRepository.findById(da.activityId);
            if (meta?.category === 'ADVENTURE' || meta?.category === 'NATURE') {
              adventureCount++;
            }
          }
        }
      }

      // Check budget
      const expenses = await expenseRepository.findByTripId(t.id);
      const spent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      if (t.totalBudget && spent <= t.totalBudget && spent > 0) {
        tripsWithinBudget++;
      }

      // Early planning (> 30 days ahead)
      const diffDays = Math.ceil((new Date(t.startDate) - new Date(t.createdAt || today)) / (1000 * 60 * 60 * 24));
      if (diffDays >= 30) {
        hasEarlyPlanned = true;
      }

      // Packing completion
      const packing = await packingRepository.findByTripId(t.id);
      if (packing.length >= 3 && packing.every((p) => p.isPacked)) {
        hasPerfectPacking = true;
      }
    }

    const collaborations = await tripCollaboratorRepository.findByUserId(userId);

    const metrics = {
      totalTrips: dashboard.totalTrips,
      completedTrips: dashboard.completedTrips,
      uniqueCitiesCount: dashboard.totalCitiesVisited,
      adventureActivitiesCount: adventureCount,
      tripsWithinBudget,
      collaborativeTripsCount: collaborations.length,
      hasEarlyPlannedTrip: hasEarlyPlanned,
      hasPerfectPackingTrip: hasPerfectPacking
    };

    return evaluateAchievements(metrics);
  }

  /**
   * 9. Single Trip Insights & Diagnostics
   */
  async getSingleTripInsights(tripId, userId) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);

    const duration = getDurationInDays(trip.startDate, trip.endDate);
    const budgetAnalysis = await budgetService.getTripBudgetAnalytics(trip.id, userId);
    const expenses = await expenseRepository.findByTripId(trip.id);
    const actualSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // Most expensive category
    const catMap = new Map();
    expenses.forEach((e) => {
      catMap.set(e.category, (catMap.get(e.category) || 0) + Number(e.amount));
    });
    let mostExpensiveCategory = 'NONE';
    let maxCatSpend = 0;
    for (const [cat, amt] of catMap.entries()) {
      if (amt > maxCatSpend) {
        maxCatSpend = amt;
        mostExpensiveCategory = cat;
      }
    }

    // Days & Activities
    const sections = await tripSectionRepository.findByTripId(trip.id);
    let totalActivities = 0;
    let busiestDay = { dayNumber: 1, activityCount: 0 };
    let emptyDays = 0;
    let mostExpensiveActivity = { name: 'None', cost: 0 };

    let globalDayIndex = 1;
    for (const s of sections) {
      const days = await dayRepository.findBySectionId(s.id);
      for (const d of days) {
        const dayActs = await dayActivityRepository.findByDayId(d.id);
        totalActivities += dayActs.length;

        if (dayActs.length === 0) {
          emptyDays++;
        }

        if (dayActs.length > busiestDay.activityCount) {
          busiestDay = {
            dayNumber: globalDayIndex,
            date: d.date,
            activityCount: dayActs.length
          };
        }

        for (const da of dayActs) {
          const actMeta = await activityRepository.findById(da.activityId);
          const cost = Number(da.customCost || actMeta?.cost || 0);
          if (cost > mostExpensiveActivity.cost) {
            mostExpensiveActivity = {
              name: actMeta?.name || `Activity #${da.activityId}`,
              cost
            };
          }
        }

        globalDayIndex++;
      }
    }

    const health = await tripHealthService.analyzeTripHealth(trip.id, userId);
    const readiness = await tripPreparationService.getTripReadiness(trip.id, userId, false);

    return {
      tripId: trip.id,
      name: trip.name,
      budget: {
        total: Number(trip.totalBudget || 0),
        used: actualSpent,
        percentage: trip.totalBudget ? Math.round((actualSpent / trip.totalBudget) * 100) : 0,
        remaining: Math.max(0, Number(trip.totalBudget || 0) - actualSpent)
      },
      costPerDay: duration > 0 ? Math.round(budgetAnalysis.estimatedTotalTripCost / duration) : 0,
      mostExpensiveCategory,
      mostExpensiveActivity,
      busiestDay,
      emptyDays,
      citiesCount: sections.length,
      activitiesCount: totalActivities,
      healthScore: health.score !== undefined ? health.score : (health.healthScore || 0),
      readinessScore: readiness.score
    };
  }

  /**
   * 10. System Administrator Analytics & Diagnostics
   */
  async getAdminAnalytics() {
    const userRepository = require('../repositories/userRepository');
    const userRes = await userRepository.findAll({ limit: 10000 });
    const users = userRes && userRes.users ? userRes.users : [];
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => !u.isBlocked).length;
    const blockedUsers = users.filter((u) => u.isBlocked).length;

    const mockDb = require('../repositories/mockDatabase');
    const totalTrips = mockDb.trips.length;
    const totalCities = mockDb.cities.length;
    const totalActivities = mockDb.activities.length;
    const totalPosts = mockDb.communityPosts.length;
    const totalExpenses = mockDb.expenses.length;

    return {
      overview: {
        totalUsers,
        activeUsers,
        blockedUsers,
        totalTrips,
        totalCities,
        totalActivities,
        totalPosts,
        totalExpenses
      }
    };
  }
}

module.exports = new AnalyticsService();
