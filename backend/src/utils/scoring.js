/**
 * Scoring and Ranking Utilities for Smart Recommendation Engine
 */

const ALLOWED_CATEGORIES = ['ADVENTURE', 'CULTURE', 'NATURE', 'FOOD', 'RELAXATION', 'ENTERTAINMENT', 'SHOPPING'];

/**
 * Calculates recommendation score (0 - 100) for a city based on user preferences and trip parameters.
 * @param {object} city
 * @param {object[]} activitiesForCity
 * @param {object} params - { budget, tripDurationDays, interests, preferredCountries, budgetLevel }
 * @returns {{ score: number, reasoning: string[], matchingActivitiesCount: number }}
 */
const calculateCityScore = (city, activitiesForCity = [], params = {}) => {
  const {
    budget = 50000,
    tripDurationDays = 7,
    interests = [],
    preferredCountries = [],
    budgetLevel = 'MEDIUM'
  } = params;

  let score = 0;
  const reasoning = [];

  // 1. Base Popularity Score (Max 30 points)
  const popularity = city.popularity || 75;
  const popularityScore = (popularity / 100) * 30;
  score += popularityScore;
  if (popularity >= 90) {
    reasoning.push(`World-renowned top destination (Popularity rating: ${popularity}/100)`);
  } else {
    reasoning.push(`Popular tourist hotspot (Popularity rating: ${popularity}/100)`);
  }

  // 2. Interest Match Score (Max 35 points)
  const normalizedInterests = (interests || []).map((i) => i.toUpperCase());
  const matchingActivities = activitiesForCity.filter((act) =>
    normalizedInterests.includes((act.category || '').toUpperCase())
  );
  const matchCount = matchingActivities.length;

  if (normalizedInterests.length > 0) {
    if (matchCount > 0) {
      const matchRatio = matchCount / Math.max(1, activitiesForCity.length);
      const interestScore = Math.min(35, matchCount * 8 + matchRatio * 15);
      score += interestScore;
      const matchedCategories = [...new Set(matchingActivities.map((a) => a.category))];
      reasoning.push(`Offers ${matchCount} activities matching your interests: ${matchedCategories.join(', ')}`);
    } else {
      score += 5; // Minimal fallback
      reasoning.push('Offers diverse general sightseeing and leisure opportunities');
    }
  } else {
    // No specific interests provided -> distribute 25 points evenly
    score += 25;
    reasoning.push('Well-rounded destination with rich sightseeing, culture, and dining');
  }

  // 3. Preferred Country Score (Max 25 points)
  const normalizedCountries = (preferredCountries || []).map((c) => c.toLowerCase().trim());
  if (normalizedCountries.length > 0) {
    const isPreferred = normalizedCountries.some(
      (c) => c === (city.country || '').toLowerCase() || (city.country || '').toLowerCase().includes(c)
    );
    if (isPreferred) {
      score += 25;
      reasoning.push(`Directly matches your preferred destination country: ${city.country}`);
    } else {
      score += 5;
    }
  } else {
    score += 15; // Neutral country points
  }

  // 4. Budget & Cost Index Compatibility (Max 10 points + penalty)
  const safeDays = Math.max(1, tripDurationDays);
  const dailyBudget = budget / safeDays;
  const costIndex = city.costIndex || 50; // 0-100 scale
  const estimatedDailyCost = costIndex * 85; // approx ₹3,000 - ₹8,500 / day

  if (dailyBudget >= estimatedDailyCost) {
    score += 10;
    reasoning.push(`Budget-friendly for your planned spending (Estimated daily baseline ₹${Math.round(estimatedDailyCost)})`);
  } else {
    // Moderate penalty if city cost index is significantly higher than daily budget
    const shortfallRatio = (estimatedDailyCost - dailyBudget) / estimatedDailyCost;
    const penalty = Math.min(20, Math.round(shortfallRatio * 20));
    score = Math.max(0, score - penalty);
    reasoning.push(`Premium cost tier destination (Cost Index ${costIndex}/100); budget conscious planning recommended`);
  }

  const finalScore = Math.min(100, Math.max(10, Math.round(score)));

  return {
    score: finalScore,
    reasoning,
    matchingActivitiesCount: matchCount
  };
};

/**
 * Calculates recommendation score (0 - 100) for an activity.
 * @param {object} activity
 * @param {object} city
 * @param {object} params - { budget, interests }
 * @returns {{ score: number, reason: string }}
 */
const calculateActivityScore = (activity, city, params = {}) => {
  const { budget = 50000, interests = [] } = params;
  const normalizedInterests = (interests || []).map((i) => i.toUpperCase());

  let score = 0;
  let reason = '';

  const isInterestMatch = normalizedInterests.includes((activity.category || '').toUpperCase());

  if (isInterestMatch) {
    score += 45;
    reason = `Matches your ${activity.category} interest`;
  } else {
    score += 20;
    reason = `Highly recommended ${activity.category.toLowerCase()} experience in ${city ? city.name : 'the city'}`;
  }

  // Cost feasibility
  const cost = activity.estimatedCost || 0;
  if (cost === 0) {
    score += 25;
    reason += ' (Free admission)';
  } else if (cost <= budget * 0.1) {
    score += 25;
    reason += ` and easily fits your budget (₹${cost})`;
  } else if (cost <= budget * 0.25) {
    score += 15;
    reason += ` (₹${cost})`;
  } else {
    score += 5;
    reason += ` (Premium activity: ₹${cost})`;
  }

  // Base rating/duration bonus
  score += 30;

  const finalScore = Math.min(100, Math.max(15, Math.round(score)));

  return {
    score: finalScore,
    reason
  };
};

module.exports = {
  ALLOWED_CATEGORIES,
  calculateCityScore,
  calculateActivityScore
};
