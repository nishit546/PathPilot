/**
 * Generates deterministic insights from user analytics metrics and trip patterns.
 */
const generateInsights = ({
  tripsSummary,
  spendingSummary,
  activitiesSummary,
  citiesSummary
}) => {
  const insights = [];

  // 1. Spending Patterns
  if (spendingSummary.totalSpent > 0 && spendingSummary.breakdown.length > 0) {
    const topCategory = spendingSummary.breakdown.reduce((max, c) => (c.amount > max.amount ? c : max), spendingSummary.breakdown[0]);
    const topPct = Math.round((topCategory.amount / spendingSummary.totalSpent) * 100);

    if (topPct >= 35) {
      insights.push({
        type: 'SPENDING_PATTERN',
        title: `${topCategory.label} dominates your travel spending`,
        description: `${topCategory.label} accounts for ${topPct}% of your total recorded travel expenses (₹${topCategory.amount.toLocaleString()}).`,
        severity: 'INFO',
        metadata: { category: topCategory.label, percentage: topPct, amount: topCategory.amount }
      });
    }

    if (spendingSummary.averageDailyCost > 0) {
      insights.push({
        type: 'BUDGET_PATTERN',
        title: `Average daily expenditure of ₹${Math.round(spendingSummary.averageDailyCost).toLocaleString()}`,
        description: `Across your active travel days, your mean daily spend is ₹${Math.round(spendingSummary.averageDailyCost).toLocaleString()}.`,
        severity: 'INFO',
        metadata: { averageDailyCost: Math.round(spendingSummary.averageDailyCost) }
      });
    }
  }

  // 2. Activity Patterns
  if (activitiesSummary.favoriteCategories && activitiesSummary.favoriteCategories.length > 0) {
    const topCat = activitiesSummary.favoriteCategories[0];
    insights.push({
      type: 'ACTIVITY_PATTERN',
      title: `${topCat.category} is your favorite activity type`,
      description: `You have planned or scheduled ${topCat.count} ${topCat.category.toLowerCase()} activities across your itineraries.`,
      severity: 'INFO',
      metadata: { category: topCat.category, count: topCat.count }
    });
  }

  // 3. City Preferences
  if (citiesSummary.mostVisited && citiesSummary.mostVisited.length > 0) {
    const topCity = citiesSummary.mostVisited[0];
    if (topCity.count > 1) {
      insights.push({
        type: 'CITY_PATTERN',
        title: `${topCity.city} is your most visited destination`,
        description: `You have returned to ${topCity.city} across ${topCity.count} different trips.`,
        severity: 'INFO',
        metadata: { city: topCity.city, visitCount: topCity.count }
      });
    }
  }

  // 4. Travel Velocity & Completion
  if (tripsSummary.totalTrips > 0) {
    const completionRate = Math.round((tripsSummary.completedTrips / tripsSummary.totalTrips) * 100);
    insights.push({
      type: 'TRAVEL_PATTERN',
      title: `Average trip duration: ${tripsSummary.averageTripDuration} days`,
      description: `You have planned ${tripsSummary.totalTrips} total trips with an overall completion rate of ${completionRate}%.`,
      severity: 'INFO',
      metadata: {
        totalTrips: tripsSummary.totalTrips,
        completedTrips: tripsSummary.completedTrips,
        averageTripDuration: tripsSummary.averageTripDuration
      }
    });

    if (tripsSummary.upcomingTrips > 0) {
      insights.push({
        type: 'TREND',
        title: `${tripsSummary.upcomingTrips} upcoming adventure${tripsSummary.upcomingTrips > 1 ? 's' : ''} on your horizon`,
        description: `You have ${tripsSummary.upcomingTrips} upcoming scheduled journey${tripsSummary.upcomingTrips > 1 ? 's' : ''} waiting to be explored.`,
        severity: 'INFO',
        metadata: { upcomingTrips: tripsSummary.upcomingTrips }
      });
    }
  }

  // Fallback for empty state
  if (insights.length === 0) {
    insights.push({
      type: 'TRAVEL_PATTERN',
      title: 'Ready for your first expedition',
      description: 'Create trips, schedule activities, and log expenses to unlock intelligent behavioral insights.',
      severity: 'INFO',
      metadata: {}
    });
  }

  return insights;
};

module.exports = {
  generateInsights
};
