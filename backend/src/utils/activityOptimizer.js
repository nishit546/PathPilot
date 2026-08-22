/**
 * Day Activity Optimization and Scheduling Utility
 */

const optimizeDayActivities = (dayActivitiesWithMeta) => {
  const warnings = [];

  const currentOrder = dayActivitiesWithMeta.map((da, idx) => ({
    id: da.id,
    activityId: da.activityId,
    name: da.activity?.name || `Activity #${da.activityId}`,
    category: da.activity?.category || 'OTHER',
    startTime: da.startTime || null,
    endTime: da.endTime || null,
    duration: da.activity?.duration || 2,
    order: da.order || idx + 1
  }));

  // Calculate total scheduled duration
  const totalDuration = dayActivitiesWithMeta.reduce(
    (sum, da) => sum + Number(da.activity?.duration || 2),
    0
  );

  if (totalDuration > 10) {
    warnings.push(`Your current schedule of ${totalDuration} hours exceeds the comfortable daily activity limit of 10 hours.`);
  }

  // Sort activities logically:
  // 1. Fixed startTime items sorted by startTime
  // 2. Nature/Adventure morning -> Sightseeing/Culture midday -> Food/Relaxation evening
  const categoryPriority = {
    NATURE: 1,
    ADVENTURE: 1,
    CULTURE: 2,
    ENTERTAINMENT: 3,
    FOOD: 4,
    OTHER: 5
  };

  const sorted = [...dayActivitiesWithMeta].sort((a, b) => {
    if (a.startTime && b.startTime) {
      return a.startTime.localeCompare(b.startTime);
    }
    if (a.startTime) return -1;
    if (b.startTime) return 1;

    const catA = (a.activity?.category || 'OTHER').toUpperCase();
    const catB = (b.activity?.category || 'OTHER').toUpperCase();
    const prioA = categoryPriority[catA] || 5;
    const prioB = categoryPriority[catB] || 5;

    return prioA - prioB;
  });

  // Assign recommended time slots
  let currentHour = 9;
  let currentMinute = 0;

  const optimizedOrder = sorted.map((da, idx) => {
    const dur = Number(da.activity?.duration || 2);
    const durHours = Math.floor(dur);
    const durMins = Math.round((dur - durHours) * 60);

    const startHStr = String(currentHour).padStart(2, '0');
    const startMStr = String(currentMinute).padStart(2, '0');
    const suggestedStart = da.startTime || `${startHStr}:${startMStr}`;

    let endH = currentHour + durHours;
    let endM = currentMinute + durMins;
    if (endM >= 60) {
      endH += Math.floor(endM / 60);
      endM %= 60;
    }
    const endHStr = String(endH).padStart(2, '0');
    const endMStr = String(endM).padStart(2, '0');
    const suggestedEnd = da.endTime || `${endHStr}:${endMStr}`;

    // Add 30 mins transit buffer
    currentHour = endH;
    currentMinute = endM + 30;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute %= 60;
    }

    return {
      id: da.id,
      activityId: da.activityId,
      name: da.activity?.name || `Activity #${da.activityId}`,
      category: da.activity?.category || 'OTHER',
      suggestedStartTime: suggestedStart,
      suggestedEndTime: suggestedEnd,
      duration: dur,
      suggestedOrder: idx + 1
    };
  });

  return {
    currentOrder,
    optimizedOrder,
    warnings
  };
};

module.exports = {
  optimizeDayActivities
};
