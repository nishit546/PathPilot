/**
 * Budget Optimization and Allocation Utility
 */

/**
 * Optimizes budget allocation and provides actionable savings suggestions.
 * @param {number} budget - Total user budget
 * @param {object[]} selectedCities - List of city objects
 * @param {object[]} selectedActivities - List of activity objects
 * @param {number} [durationDays=7]
 * @returns {object}
 */
const optimizeBudget = (budget, selectedCities = [], selectedActivities = [], durationDays = 7) => {
  const safeBudget = Number(budget) || 0;
  const safeDays = Math.max(1, Number(durationDays) || 1);

  // 1. Calculate total activity cost from selected activities
  const totalActivityCost = selectedActivities.reduce((acc, act) => acc + (Number(act.estimatedCost) || 0), 0);
  const remainingBudget = Math.max(0, safeBudget - totalActivityCost);
  const dailyBudget = Math.round(safeBudget / safeDays);

  // 2. Compute dynamic recommended allocation percentages
  // Standard split: Transport 20%, Stay 35%, Food 20%, Activities 15%, Other 10%
  let actShare = Math.min(safeBudget, totalActivityCost > 0 ? totalActivityCost : Math.round(safeBudget * 0.15));
  let unallocated = Math.max(0, safeBudget - actShare);

  const transport = Math.round(unallocated * 0.25);
  const stay = Math.round(unallocated * 0.40);
  const food = Math.round(unallocated * 0.25);
  const other = Math.max(0, unallocated - (transport + stay + food));

  const recommendedAllocation = {
    transport,
    stay,
    food,
    activities: actShare,
    other
  };

  // 3. Generate warnings and suggestions
  const warnings = [];
  const suggestions = [];

  // Over-budget check
  if (totalActivityCost > safeBudget) {
    const deficit = totalActivityCost - safeBudget;
    warnings.push({
      type: 'OVER_BUDGET',
      message: `Selected activities (₹${totalActivityCost.toLocaleString()}) exceed your total budget (₹${safeBudget.toLocaleString()}) by ₹${deficit.toLocaleString()}.`
    });

    // Sort activities by highest cost to suggest removals
    const sortedByCost = [...selectedActivities].sort((a, b) => (b.estimatedCost || 0) - (a.estimatedCost || 0));
    for (const act of sortedByCost) {
      if ((act.estimatedCost || 0) > 0) {
        suggestions.push({
          type: 'REMOVE_ACTIVITY',
          activityId: act.id,
          activityName: act.name,
          potentialSaving: act.estimatedCost,
          message: `Remove high-cost activity "${act.name}" to save ₹${act.estimatedCost.toLocaleString()}`
        });
      }
    }
  } else if (safeBudget > 0 && totalActivityCost > safeBudget * 0.4) {
    const pct = Math.round((totalActivityCost / safeBudget) * 100);
    warnings.push({
      type: 'HIGH_ACTIVITY_EXPENSE',
      message: `Activities consume ${pct}% of your total budget. Ensure sufficient funds remain for transit and lodging.`
    });
  }

  // Daily budget assessment based on city cost tiers
  if (selectedCities.length > 0) {
    const avgCostIndex = selectedCities.reduce((acc, c) => acc + (c.costIndex || 50), 0) / selectedCities.length;
    const benchmarkDailyCost = avgCostIndex * 75; // e.g. 50 * 75 = ₹3,750 / day
    if (dailyBudget < benchmarkDailyCost) {
      warnings.push({
        type: 'TIGHT_DAILY_BUDGET',
        message: `Your daily budget of ₹${dailyBudget.toLocaleString()} is below the typical benchmark (₹${Math.round(benchmarkDailyCost).toLocaleString()}/day) for ${selectedCities.map((c) => c.name).join(', ')}.`
      });
    }
  }

  return {
    totalBudget: safeBudget,
    recommendedAllocation,
    estimatedActivityCost: totalActivityCost,
    remainingBudget,
    dailyBudget,
    warnings,
    suggestions
  };
};

module.exports = {
  optimizeBudget
};
