const calculateRouteScore = ({ routeMetrics, optimalMetrics, conflicts, totalBudget, totalDays }) => {
  // 1. Route Efficiency (100 - distance delta penalty)
  let routeEfficiency = 100;
  if (optimalMetrics && routeMetrics.totalDistance > optimalMetrics.totalDistance && optimalMetrics.totalDistance > 0) {
    const excessPct = ((routeMetrics.totalDistance - optimalMetrics.totalDistance) / optimalMetrics.totalDistance) * 100;
    routeEfficiency = Math.max(40, Math.round(100 - excessPct));
  }

  // 2. Travel Time Efficiency
  let travelTime = 85;
  const avgTravelPerDay = totalDays > 0 ? routeMetrics.totalDuration / totalDays : 0;
  if (avgTravelPerDay > 3) {
    travelTime = 60;
  } else if (avgTravelPerDay > 1.5) {
    travelTime = 75;
  } else {
    travelTime = 95;
  }

  // 3. Cost Efficiency
  let costEfficiency = 80;
  if (totalBudget > 0 && routeMetrics.totalCost > 0) {
    const transportShare = (routeMetrics.totalCost / totalBudget) * 100;
    if (transportShare > 40) {
      costEfficiency = 55;
    } else if (transportShare > 25) {
      costEfficiency = 70;
    } else {
      costEfficiency = 90;
    }
  }

  // 4. Schedule Health
  let scheduleHealth = 100;
  for (const c of conflicts) {
    if (c.severity === 'CRITICAL') scheduleHealth -= 25;
    else if (c.severity === 'HIGH') scheduleHealth -= 15;
    else if (c.severity === 'MEDIUM') scheduleHealth -= 10;
    else scheduleHealth -= 5;
  }
  scheduleHealth = Math.max(20, scheduleHealth);

  const finalScore = Math.round(
    routeEfficiency * 0.35 +
    travelTime * 0.25 +
    costEfficiency * 0.20 +
    scheduleHealth * 0.20
  );

  let status = 'GOOD';
  if (finalScore >= 90) status = 'EXCELLENT';
  else if (finalScore >= 70) status = 'GOOD';
  else if (finalScore >= 50) status = 'NEEDS_IMPROVEMENT';
  else status = 'POOR';

  return {
    score: Math.min(100, Math.max(0, finalScore)),
    status,
    breakdown: {
      routeEfficiency,
      travelTime,
      costEfficiency,
      scheduleHealth
    }
  };
};

module.exports = {
  calculateRouteScore
};
