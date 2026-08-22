const { calculateTravelSegment } = require('./travelMatrix');

/**
 * Calculates total route metrics (distance, duration, cost) for an ordered list of sections.
 */
const calculateRouteMetrics = (sections) => {
  let totalDistance = 0;
  let totalDuration = 0;
  let totalCost = 0;

  for (let i = 0; i < sections.length - 1; i++) {
    const fromCity = sections[i].cityName || sections[i].city;
    const toCity = sections[i + 1].cityName || sections[i + 1].city;
    const segment = calculateTravelSegment(fromCity, toCity);

    totalDistance += segment.estimatedDistance;
    totalDuration += segment.estimatedDuration;
    totalCost += segment.estimatedCost;
  }

  return {
    totalDistance,
    totalDuration: Math.round(totalDuration * 10) / 10,
    totalCost
  };
};

/**
 * Generates all permutations of an array.
 */
const permute = (arr) => {
  if (arr.length <= 1) return [arr];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const perms = permute(remaining);
    for (const p of perms) {
      result.push([current, ...p]);
    }
  }
  return result;
};

/**
 * Finds the optimal route ordering for a set of sections.
 * Preserves the origin city if desired or searches all permutations for <= 6 sections.
 */
const findOptimalRoute = (sections) => {
  if (!sections || sections.length <= 2) {
    const currentMetrics = calculateRouteMetrics(sections || []);
    return {
      currentRoute: sections || [],
      optimizedRoute: sections || [],
      changes: [],
      estimatedImprovement: {
        distanceSaved: 0,
        travelTimeSaved: 0,
        estimatedCostSaved: 0
      }
    };
  }

  const currentMetrics = calculateRouteMetrics(sections);

  // Keep first section (origin) fixed, permute the rest for best route
  const first = sections[0];
  const rest = sections.slice(1);
  const candidatePerms = permute(rest);

  let bestPerm = sections;
  let bestMetrics = currentMetrics;

  for (const p of candidatePerms) {
    const candidateRoute = [first, ...p];
    const metrics = calculateRouteMetrics(candidateRoute);
    if (metrics.totalDistance < bestMetrics.totalDistance) {
      bestMetrics = metrics;
      bestPerm = candidateRoute;
    }
  }

  // Calculate changes
  const changes = [];
  bestPerm.forEach((sec, newIdx) => {
    const oldIdx = sections.findIndex((s) => s.id === sec.id);
    if (oldIdx !== newIdx) {
      changes.push({
        sectionId: sec.id,
        city: sec.cityName || sec.city,
        oldPosition: oldIdx + 1,
        newPosition: newIdx + 1
      });
    }
  });

  const distanceSaved = Math.max(0, currentMetrics.totalDistance - bestMetrics.totalDistance);
  const travelTimeSaved = Math.max(0, Math.round((currentMetrics.totalDuration - bestMetrics.totalDuration) * 10) / 10);
  const estimatedCostSaved = Math.max(0, currentMetrics.totalCost - bestMetrics.totalCost);

  return {
    currentRoute: sections,
    optimizedRoute: bestPerm,
    changes,
    estimatedImprovement: {
      distanceSaved,
      travelTimeSaved,
      estimatedCostSaved
    }
  };
};

module.exports = {
  calculateRouteMetrics,
  findOptimalRoute
};
