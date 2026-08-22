/**
 * Itinerary Analyzer Utility for Smart Suggestions
 */

/**
 * Analyzes an existing trip itinerary and produces actionable optimization suggestions.
 * @param {object} trip
 * @param {object[]} sections
 * @param {object[]} days
 * @param {object[]} dayActivities - All scheduled activities with master details populated
 * @param {object[]} allMasterActivities - Catalog of all available master activities
 * @param {object[]} allCities - Catalog of all available cities
 * @returns {object[]} Array of suggestions
 */
const analyzeItinerary = (trip, sections = [], days = [], dayActivities = [], allMasterActivities = [], allCities = []) => {
  const suggestions = [];

  if (!days || days.length === 0) {
    return [
      {
        type: 'NO_SECTIONS',
        message: 'Your trip does not have any destination sections or days planned yet. Add a destination section to start scheduling activities.',
        recommendedAction: 'Add destination stops to your trip itinerary.'
      }
    ];
  }

  const totalDays = days.length;
  const averageDailyBudget = trip.totalBudget > 0 ? Math.round(trip.totalBudget / totalDays) : 0;

  // Map activities by dayId
  const activitiesByDay = {};
  days.forEach((day) => {
    activitiesByDay[String(day.id)] = [];
  });

  dayActivities.forEach((da) => {
    const key = String(da.dayId);
    if (activitiesByDay[key]) {
      activitiesByDay[key].push(da);
    }
  });

  // Map sections by id
  const sectionMap = {};
  sections.forEach((sec) => {
    sectionMap[String(sec.id)] = sec;
  });

  // Check 1: Empty Days
  days.forEach((day) => {
    const acts = activitiesByDay[String(day.id)] || [];
    const section = sectionMap[String(day.sectionId)];
    const city = section ? allCities.find((c) => String(c.id) === String(section.cityId)) : null;

    if (acts.length === 0) {
      // Find candidate activities in this city that aren't already scheduled
      const alreadyScheduledIds = dayActivities.map((a) => a.activityId);
      const candidates = allMasterActivities
        .filter((ma) => city && String(ma.cityId) === String(city.id) && !alreadyScheduledIds.map(String).includes(String(ma.id)))
        .slice(0, 3)
        .map((ma) => ({
          id: ma.id,
          name: ma.name,
          category: ma.category,
          estimatedCost: ma.estimatedCost,
          duration: ma.duration
        }));

      suggestions.push({
        type: 'EMPTY_DAY',
        dayId: day.id,
        dayNumber: day.dayNumber,
        date: day.date,
        cityName: city ? city.name : null,
        message: `You have no activities planned for Day ${day.dayNumber} (${day.date})${city ? ` in ${city.name}` : ''}.`,
        recommendedActivities: candidates
      });
    } else if (acts.length > 3) {
      // Check 2: Overloaded Days
      suggestions.push({
        type: 'OVERLOADED_DAY',
        dayId: day.id,
        dayNumber: day.dayNumber,
        date: day.date,
        message: `Day ${day.dayNumber} has ${acts.length} scheduled activities. You might experience schedule fatigue.`,
        recommendedAction: 'Consider spreading 1-2 activities across neighboring lighter days.'
      });
    }

    // Check 3: High Cost Day / Over Budget
    if (averageDailyBudget > 0 && acts.length > 0) {
      const dayTotalCost = acts.reduce((sum, a) => {
        const cost = a.customCost !== null && a.customCost !== undefined ? a.customCost : (a.activity?.estimatedCost || 0);
        return sum + Number(cost);
      }, 0);

      if (dayTotalCost > averageDailyBudget * 1.5) {
        suggestions.push({
          type: 'OVER_BUDGET',
          dayId: day.id,
          dayNumber: day.dayNumber,
          date: day.date,
          dayCost: dayTotalCost,
          averageDailyBudget,
          message: `Day ${day.dayNumber} activities cost (₹${dayTotalCost.toLocaleString()}) exceeds 150% of your average daily budget (₹${averageDailyBudget.toLocaleString()}).`,
          recommendedAction: 'Review activity bookings or explore budget-friendly cultural alternatives for this day.'
        });
      }
    }
  });

  // Check 4: Missing Category Suggestions across the trip
  const scheduledCategories = new Set(
    dayActivities.map((da) => da.activity?.category || '').filter(Boolean)
  );

  if (!scheduledCategories.has('FOOD') && dayActivities.length >= 3) {
    suggestions.push({
      type: 'MISSING_CATEGORY',
      category: 'FOOD',
      message: 'No culinary or food experiences are currently scheduled in your itinerary.',
      recommendedAction: 'Add a local food tasting or dining experience to enhance your journey.'
    });
  }

  if (!scheduledCategories.has('CULTURE') && dayActivities.length >= 3) {
    suggestions.push({
      type: 'MISSING_CATEGORY',
      category: 'CULTURE',
      message: 'No heritage or cultural tours are currently scheduled.',
      recommendedAction: 'Add a museum visit or heritage landmark to discover local history.'
    });
  }

  return suggestions;
};

module.exports = {
  analyzeItinerary
};
