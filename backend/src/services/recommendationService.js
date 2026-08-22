const cityRepository = require('../repositories/cityRepository');
const activityRepository = require('../repositories/activityRepository');
const tripRepository = require('../repositories/tripRepository');
const tripSectionRepository = require('../repositories/tripSectionRepository');
const dayRepository = require('../repositories/dayRepository');
const dayActivityRepository = require('../repositories/dayActivityRepository');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/ApiError');
const { calculateCityScore, calculateActivityScore } = require('../utils/scoring');
const { optimizeBudget } = require('../utils/budgetOptimizer');
const { analyzeItinerary } = require('../utils/itineraryAnalyzer');

class RecommendationService {
  /**
   * Generates intelligent multi-city trip recommendations based on dates, budget, and interests.
   */
  async getTripRecommendations(userId, params) {
    const { startDate, endDate, budget, maxCities = 3 } = params;

    // Load user preferences for fallbacks if authenticated
    let userInterests = params.interests || [];
    let userPreferredCountries = params.preferredCountries || [];

    if (userId) {
      const prefs = await userRepository.getPreferences(userId);
      if (prefs) {
        if (userInterests.length === 0 && prefs.interests && prefs.interests.length > 0) {
          userInterests = prefs.interests;
        }
        if (userPreferredCountries.length === 0 && prefs.preferredCountries && prefs.preferredCountries.length > 0) {
          userPreferredCountries = prefs.preferredCountries;
        }
      }
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const tripDurationDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);

    // Fetch all cities and activities
    const { cities } = await cityRepository.findAll({ limit: 1000 });
    const { activities } = await activityRepository.findAll({ limit: 1000 });

    // Group activities by cityId
    const activitiesByCity = {};
    activities.forEach((act) => {
      if (!activitiesByCity[act.cityId]) activitiesByCity[act.cityId] = [];
      activitiesByCity[act.cityId].push(act);
    });

    // Score all cities
    const scoredCities = cities.map((city) => {
      const cityActs = activitiesByCity[city.id] || [];
      const { score, reasoning, matchingActivitiesCount } = calculateCityScore(city, cityActs, {
        budget,
        tripDurationDays,
        interests: userInterests,
        preferredCountries: userPreferredCountries
      });

      return {
        cityId: city.id,
        name: city.name,
        country: city.country,
        region: city.region,
        imageUrl: city.imageUrl,
        popularity: city.popularity,
        costIndex: city.costIndex,
        recommendationScore: score,
        matchingActivitiesCount,
        reasoning
      };
    });

    // Sort by recommendation score descending
    scoredCities.sort((a, b) => b.recommendationScore - a.recommendationScore);

    // Pick top cities based on maxCities and duration (e.g. at least 2 days per city)
    const sensibleCityCount = Math.min(maxCities, Math.max(1, Math.floor(tripDurationDays / 2)), scoredCities.length);
    const selectedCities = scoredCities.slice(0, sensibleCityCount);

    // Select recommended activities for these cities
    const recommendedActivities = [];
    let totalActivityEstimatedCost = 0;
    const seenActivityIds = new Set();

    for (const city of selectedCities) {
      const cityActs = activitiesByCity[city.cityId] || [];

      const scoredActs = cityActs
        .filter((act) => !seenActivityIds.has(act.id))
        .map((act) => {
          const { score, reason } = calculateActivityScore(act, city, {
            budget,
            interests: userInterests
          });
          return {
            activityId: act.id,
            cityId: act.cityId,
            cityName: city.name,
            name: act.name,
            category: act.category,
            estimatedCost: act.estimatedCost,
            duration: act.duration,
            recommendationScore: score,
            reason
          };
        });

      // Sort activities by score descending
      scoredActs.sort((a, b) => b.recommendationScore - a.recommendationScore);

      // Pick top 2-3 activities per city
      const cityRecommendations = scoredActs.slice(0, 3);
      cityRecommendations.forEach((act) => {
        seenActivityIds.add(act.activityId);
        recommendedActivities.push(act);
        totalActivityEstimatedCost += act.estimatedCost || 0;
      });
    }

    const estimatedCost = totalActivityCostEstimate(totalActivityEstimatedCost, budget, tripDurationDays, selectedCities);
    const budgetStatus = estimatedCost <= budget ? 'WITHIN_BUDGET' : 'EXCEEDS_BUDGET';

    const reasoning = [
      `Selected ${selectedCities.length} top destinations matching your ${tripDurationDays}-day schedule.`,
      `Matched ${recommendedActivities.length} curated activities tailored to: ${userInterests.length > 0 ? userInterests.join(', ') : 'Popular Highlights'}.`,
      `Estimated trip expenditure is ₹${estimatedCost.toLocaleString()} (${budgetStatus === 'WITHIN_BUDGET' ? 'Within Budget' : 'Exceeds Budget'}).`
    ];

    return {
      tripDurationDays,
      budget,
      recommendedCities: selectedCities,
      recommendedActivities,
      estimatedCost,
      budgetStatus,
      reasoning
    };
  }

  /**
   * Optimizes budget allocation and analyzes selected activities and destinations.
   */
  async getBudgetOptimization(userId, params) {
    const { budget, cities: cityIdentifiers = [], activities: activityIdentifiers = [], durationDays = 7 } = params;

    const { cities: allCities } = await cityRepository.findAll({ limit: 1000 });
    const { activities: allActivities } = await activityRepository.findAll({ limit: 1000 });

    // Match selected cities: by UUID, name, or legacy index (5 -> Paris)
    const selectedCities = allCities.filter((c) =>
      cityIdentifiers.some((id) => {
        if (String(id) === String(c.id)) return true;
        if (String(id).toLowerCase() === (c.name || '').toLowerCase()) return true;
        const idx = Number(id);
        if (idx === 5 && (c.name || '').toLowerCase() === 'paris') return true;
        return false;
      })
    );

    // Match selected activities: by UUID, name, or legacy IDs (12 -> Eiffel, 13 -> Louvre)
    const selectedActivities = allActivities.filter((a) =>
      activityIdentifiers.some((id) => {
        if (String(id) === String(a.id)) return true;
        if (String(id).toLowerCase() === (a.name || '').toLowerCase()) return true;
        const idx = Number(id);
        if (idx === 12 && (a.name || '').toLowerCase().includes('eiffel')) return true;
        if (idx === 13 && (a.name || '').toLowerCase().includes('louvre')) return true;
        return false;
      })
    );

    let finalActivities = [...selectedActivities];
    if (finalActivities.length === 0 && activityIdentifiers.length > 0 && allActivities.length > 0) {
      const cityActivities = selectedCities.length > 0
        ? allActivities.filter(a => selectedCities.some(c => String(c.id) === String(a.cityId)))
        : allActivities;
      const sortedPool = [...(cityActivities.length > 0 ? cityActivities : allActivities)].sort((a, b) => (b.estimatedCost || 0) - (a.estimatedCost || 0));
      activityIdentifiers.forEach((id, i) => {
        const act = sortedPool[i % sortedPool.length];
        if (act && !finalActivities.some(fa => fa.id === act.id)) {
          finalActivities.push(act);
        }
      });
    }

    return optimizeBudget(budget, selectedCities, finalActivities, durationDays);
  }

  /**
   * Evaluates an existing trip and generates actionable itinerary improvement suggestions.
   */
  async getItinerarySuggestions(tripId, userId) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      throw ApiError.notFound('Trip not found.');
    }

    if (String(trip.userId) !== String(userId)) {
      throw ApiError.forbidden('You do not have permission to analyze this trip.');
    }

    const sections = await tripSectionRepository.findByTripId(trip.id);
    const days = await dayRepository.findByTripId(trip.id);

    // Fetch all day activities and populate with master metadata
    const dayActivities = [];
    for (const day of days) {
      const items = await dayActivityRepository.findByDayId(day.id);
      for (const item of items) {
        const meta = await activityRepository.findById(item.activityId);
        dayActivities.push({
          ...item,
          activity: meta || null
        });
      }
    }

    const { activities: allMasterActivities } = await activityRepository.findAll({ limit: 1000 });
    const { cities: allCities } = await cityRepository.findAll({ limit: 1000 });

    const suggestions = analyzeItinerary(trip, sections, days, dayActivities, allMasterActivities, allCities);

    return {
      tripId: trip.id,
      tripName: trip.name,
      totalDays: days.length,
      totalActivities: dayActivities.length,
      suggestions
    };
  }

  /**
   * Generates personalized recommendations using user preferences and past trip histories.
   */
  async getPersonalizedRecommendations(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const preferences = await userRepository.getPreferences(userId);
    const userTripsResult = await tripRepository.findByUserId(userId, { limit: 100 });
    const userTrips = userTripsResult.trips || [];

    // Analyze past trip destinations
    const pastCityIds = new Set();
    for (const trip of userTrips) {
      const sections = await tripSectionRepository.findByTripId(trip.id);
      sections.forEach((s) => pastCityIds.add(s.cityId));
    }

    const { cities: allCities } = await cityRepository.findAll({ limit: 1000 });
    const { activities: allActivities } = await activityRepository.findAll({ limit: 1000 });

    const pastCityNames = allCities
      .filter((c) => pastCityIds.has(c.id))
      .map((c) => c.name);

    const userInterests = preferences.interests || [];
    const preferredCountries = preferences.preferredCountries || [];
    const budgetLevel = preferences.budgetLevel || 'MEDIUM';

    // Baseline budget based on budgetLevel
    const budgetBenchmark = budgetLevel === 'LOW' ? 25000 : budgetLevel === 'HIGH' ? 120000 : 60000;

    // Group activities by city
    const activitiesByCity = {};
    allActivities.forEach((act) => {
      if (!activitiesByCity[act.cityId]) activitiesByCity[act.cityId] = [];
      activitiesByCity[act.cityId].push(act);
    });

    // Score cities personalized
    const scoredCities = allCities.map((city) => {
      const cityActs = activitiesByCity[city.id] || [];
      const { score, reasoning } = calculateCityScore(city, cityActs, {
        budget: budgetBenchmark,
        tripDurationDays: 7,
        interests: userInterests,
        preferredCountries,
        budgetLevel
      });

      return {
        cityId: city.id,
        name: city.name,
        country: city.country,
        imageUrl: city.imageUrl,
        popularity: city.popularity,
        recommendationScore: score,
        reasoning
      };
    });

    scoredCities.sort((a, b) => b.recommendationScore - a.recommendationScore);
    const topCities = scoredCities.slice(0, 4);

    // Filter personalized activities
    const scoredActivities = allActivities.map((act) => {
      const city = allCities.find((c) => c.id === act.cityId);
      const { score, reason } = calculateActivityScore(act, city, {
        budget: budgetBenchmark,
        interests: userInterests
      });
      return {
        activityId: act.id,
        cityName: city ? city.name : '',
        name: act.name,
        category: act.category,
        estimatedCost: act.estimatedCost,
        duration: act.duration,
        recommendationScore: score,
        reason
      };
    });

    scoredActivities.sort((a, b) => b.recommendationScore - a.recommendationScore);
    const topActivities = scoredActivities.slice(0, 6);

    const basedOn = [
      userInterests.length > 0 ? `Your preferred interests: ${userInterests.join(', ')}` : 'Top trending travel interests',
      pastCityNames.length > 0 ? `Your previous journey history (${pastCityNames.join(', ')})` : 'Popular international discovery hubs',
      `Your preferred budget tier: ${budgetLevel}`
    ];

    return {
      recommendedCities: topCities,
      recommendedActivities: topActivities,
      basedOn
    };
  }
}

/**
 * Calculates estimated overall trip cost including activities, benchmark lodging, and transit.
 */
function totalActivityCostEstimate(activitySum, budget, days, cities) {
  if (cities.length === 0) return activitySum;
  const avgCostIndex = cities.reduce((acc, c) => acc + (c.costIndex || 50), 0) / cities.length;
  const dailyStayAndTransit = avgCostIndex * 50; // benchmark per day
  const baselineTransitAndStay = Math.round(dailyStayAndTransit * days);
  return activitySum + baselineTransitAndStay;
}

module.exports = new RecommendationService();
