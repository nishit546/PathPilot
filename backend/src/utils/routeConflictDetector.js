const { calculateTravelSegment } = require('./travelMatrix');

const detectRouteConflicts = ({ trip, sections, daysWithActivities, travelSegments }) => {
  const conflicts = [];

  // 1. Impossible date ranges & overlapping sections
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (new Date(s.endDate) < new Date(s.startDate)) {
      conflicts.push({
        type: 'IMPOSSIBLE_DATE_RANGE',
        severity: 'CRITICAL',
        sectionId: s.id,
        message: `Section for ${s.cityName || 'City'} has an end date (${s.endDate}) before its start date (${s.startDate}).`
      });
    }

    if (i < sections.length - 1) {
      const next = sections[i + 1];
      if (new Date(s.endDate) > new Date(next.startDate)) {
        conflicts.push({
          type: 'OVERLAPPING_SECTIONS',
          severity: 'HIGH',
          sectionId: s.id,
          message: `Section ${s.cityName} (${s.startDate} to ${s.endDate}) overlaps with next destination ${next.cityName} (${next.startDate}).`
        });
      }

      // Check travel time gap
      const segment = calculateTravelSegment(s.cityName, next.cityName);
      const gapHours = (new Date(next.startDate).getTime() - new Date(s.endDate).getTime()) / (1000 * 60 * 60);
      if (gapHours < segment.estimatedDuration && segment.estimatedDuration > 4) {
        conflicts.push({
          type: 'INSUFFICIENT_TRAVEL_TIME',
          severity: 'HIGH',
          message: `Only ${Math.max(0, Math.round(gapHours))} hours available to travel from ${s.cityName} to ${next.cityName} (requires ~${segment.estimatedDuration} hrs).`
        });
      }
    }
  }

  // 2. Overloaded days or empty sections
  for (const s of sections) {
    const sectionDays = daysWithActivities.filter((d) => d.sectionId === s.id);
    const totalActs = sectionDays.reduce((sum, d) => sum + (d.activities ? d.activities.length : 0), 0);

    if (totalActs === 0) {
      conflicts.push({
        type: 'EMPTY_SECTION',
        severity: 'MEDIUM',
        sectionId: s.id,
        message: `No activities scheduled yet for section ${s.cityName}.`
      });
    }

    for (const d of sectionDays) {
      if (d.activities && d.activities.length > 4) {
        conflicts.push({
          type: 'OVERLOADED_DAY',
          severity: 'LOW',
          dayId: d.id,
          message: `Day ${d.dayNumber} (${d.date}) in ${s.cityName} has ${d.activities.length} activities scheduled (potential rush).`
        });
      }
    }
  }

  // 3. Missing Transport
  if (sections.length > 1) {
    for (let i = 0; i < sections.length - 1; i++) {
      const fromCity = sections[i].cityName;
      const toCity = sections[i + 1].cityName;
      const seg = travelSegments.find(
        (ts) => ts.fromCity === fromCity && ts.toCity === toCity
      );
      if (!seg || !seg.selectedMode) {
        conflicts.push({
          type: 'MISSING_TRANSPORT',
          severity: 'LOW',
          message: `No transport mode selected yet between ${fromCity} and ${toCity}.`
        });
      }
    }
  }

  return conflicts;
};

module.exports = {
  detectRouteConflicts
};
