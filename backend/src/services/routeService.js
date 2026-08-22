const tripRepository = require('../repositories/tripRepository');
const tripSectionRepository = require('../repositories/tripSectionRepository');
const dayRepository = require('../repositories/dayRepository');
const dayActivityRepository = require('../repositories/dayActivityRepository');
const activityRepository = require('../repositories/activityRepository');
const cityRepository = require('../repositories/cityRepository');
const travelSegmentRepository = require('../repositories/travelSegmentRepository');
const tripActivityLogRepository = require('../repositories/tripActivityLogRepository');
const notificationService = require('./notificationService');
const tripAccessService = require('./tripAccessService');
const { calculateTravelSegment } = require('../utils/travelMatrix');
const { calculateRouteMetrics, findOptimalRoute } = require('../utils/routeOptimizer');
const { detectRouteConflicts } = require('../utils/routeConflictDetector');
const { calculateRouteScore } = require('../utils/routeScorer');
const { optimizeDayActivities } = require('../utils/activityOptimizer');
const { getDurationInDays } = require('../utils/analyticsCalculator');
const ApiError = require('../utils/ApiError');

class RouteService {
  /**
   * Helper to fetch enriched sections with city metadata.
   */
  async _getEnrichedSections(tripId) {
    const sections = await tripSectionRepository.findByTripId(tripId);
    return Promise.all(
      sections.map(async (s) => {
        const city = await cityRepository.findById(s.cityId);
        const cityName = city ? city.name : `City #${s.cityId}`;
        const days = getDurationInDays(s.startDate, s.endDate);
        return {
          ...s,
          city: cityName,
          cityName,
          days
        };
      })
    );
  }

  /**
   * Helper to recalculate dates sequentially across reordered sections and shift days.
   */
  async _rescheduleSectionsAndDays(tripId, orderedSections) {
    let currentStartDate = new Date(orderedSections[0].startDate);

    for (let i = 0; i < orderedSections.length; i++) {
      const sec = orderedSections[i];
      const secDuration = Math.max(1, getDurationInDays(sec.startDate, sec.endDate));

      const newStart = currentStartDate.toISOString().split('T')[0];
      const endDateObj = new Date(currentStartDate);
      endDateObj.setDate(endDateObj.getDate() + (secDuration - 1));
      const newEnd = endDateObj.toISOString().split('T')[0];

      // Update section dates and order
      await tripSectionRepository.update(sec.id, {
        order: i + 1,
        startDate: newStart,
        endDate: newEnd
      });

      // Shift existing days for section
      const days = await dayRepository.findBySectionId(sec.id);
      days.sort((a, b) => a.dayNumber - b.dayNumber);

      for (let dIdx = 0; dIdx < days.length; dIdx++) {
        const dayDateObj = new Date(currentStartDate);
        dayDateObj.setDate(dayDateObj.getDate() + dIdx);
        const newDayDate = dayDateObj.toISOString().split('T')[0];

        const dayItem = days[dIdx];
        dayItem.date = newDayDate;
        dayItem.dayNumber = dIdx + 1;
      }

      // Next section starts the following day
      currentStartDate = new Date(endDateObj);
      currentStartDate.setDate(currentStartDate.getDate() + 1);
    }
  }

  /**
   * 1. Complete Trip Route Overview
   */
  async getTripRoute(tripId, userId) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);
    const sections = await this._getEnrichedSections(trip.id);

    const route = sections.map((s, idx) => ({
      order: idx + 1,
      sectionId: s.id,
      cityId: s.cityId,
      city: s.cityName,
      cityName: s.cityName,
      startDate: s.startDate,
      endDate: s.endDate,
      days: s.days
    }));

    const metrics = calculateRouteMetrics(sections);
    const totalDays = sections.reduce((sum, s) => sum + s.days, 0);

    return {
      tripId: trip.id,
      route,
      summary: {
        totalCities: sections.length,
        totalDays,
        estimatedTravelDistance: metrics.totalDistance,
        estimatedTravelTime: metrics.totalDuration,
        estimatedTravelCost: metrics.totalCost
      }
    };
  }

  /**
   * 2. Reorder Trip Cities
   */
  async reorderTripCities(tripId, userId, requestedOrder) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR']);
    const sectionIds = (requestedOrder.cityOrder || requestedOrder.sectionOrder || []).map(String);

    const existingSections = await tripSectionRepository.findByTripId(trip.id);
    const existingIds = existingSections.map((s) => String(s.id));

    // Validation
    if (sectionIds.length !== existingIds.length) {
      throw ApiError.badRequest('Every trip section must be included in the reorder request.');
    }

    const uniqueRequested = new Set(sectionIds);
    if (uniqueRequested.size !== sectionIds.length) {
      throw ApiError.badRequest('Duplicate section IDs are not allowed in the reorder request.');
    }

    for (const reqId of sectionIds) {
      if (!existingIds.includes(String(reqId))) {
        throw ApiError.badRequest(`Section ID ${reqId} does not belong to this trip.`);
      }
    }

    const orderedSections = sectionIds.map((id) => existingSections.find((s) => s.id === id));
    await this._rescheduleSectionsAndDays(trip.id, orderedSections);

    // Refresh travel segments
    await travelSegmentRepository.deleteByTripId(trip.id);

    // Activity Log
    await tripActivityLogRepository.create({
      tripId: trip.id,
      userId,
      action: 'ROUTE_REORDERED',
      description: `Reordered cities on itinerary route.`
    });

    return this.getTripRoute(trip.id, userId);
  }

  /**
   * 3. Route Optimization Suggestions
   */
  async getRouteOptimization(tripId, userId) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);
    const sections = await this._getEnrichedSections(trip.id);

    const optimization = findOptimalRoute(sections);

    return {
      tripId: trip.id,
      currentRoute: optimization.currentRoute.map((s, idx) => ({
        order: idx + 1,
        sectionId: s.id,
        city: s.cityName,
        startDate: s.startDate,
        endDate: s.endDate
      })),
      optimizedRoute: optimization.optimizedRoute.map((s, idx) => ({
        order: idx + 1,
        sectionId: s.id,
        city: s.cityName
      })),
      changes: optimization.changes,
      estimatedImprovement: optimization.estimatedImprovement
    };
  }

  /**
   * 4. Apply Route Optimization
   */
  async applyRouteOptimization(tripId, userId, sectionOrder) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR']);
    const targetIds = sectionOrder.map(String);

    const existingSections = await this._getEnrichedSections(trip.id);
    const existingIds = existingSections.map((s) => String(s.id));

    if (targetIds.length !== existingIds.length || targetIds.some((id) => !existingIds.includes(String(id)))) {
      throw ApiError.badRequest('Invalid section order provided for optimization apply.');
    }

    const orderedSections = targetIds.map((id) => existingSections.find((s) => String(s.id) === String(id)));
    const oldRouteStr = existingSections.map((s) => s.cityName).join(' → ');
    const newRouteStr = orderedSections.map((s) => s.cityName).join(' → ');

    await this._rescheduleSectionsAndDays(trip.id, orderedSections);
    await travelSegmentRepository.deleteByTripId(trip.id);

    // Activity Log
    await tripActivityLogRepository.create({
      tripId: trip.id,
      userId,
      action: 'ROUTE_OPTIMIZED',
      description: `Optimized itinerary order: ${oldRouteStr} → ${newRouteStr}`
    });

    return this.getTripRoute(trip.id, userId);
  }

  /**
   * 5. Travel Segments Management
   */
  async getTravelSegments(tripId, userId) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);
    const sections = await this._getEnrichedSections(trip.id);

    if (sections.length <= 1) {
      return [];
    }

    let existingSegments = await travelSegmentRepository.findByTripId(trip.id);

    // If segments not generated or order changed, generate them
    if (existingSegments.length !== sections.length - 1) {
      await travelSegmentRepository.deleteByTripId(trip.id);
      existingSegments = [];

      for (let i = 0; i < sections.length - 1; i++) {
        const fromSec = sections[i];
        const toSec = sections[i + 1];
        const segData = calculateTravelSegment(fromSec.cityName, toSec.cityName);

        const created = await travelSegmentRepository.create({
          tripId: trip.id,
          fromCityId: fromSec.cityId,
          toCityId: toSec.cityId,
          fromCity: fromSec.cityName,
          toCity: toSec.cityName,
          estimatedDistance: segData.estimatedDistance,
          estimatedDuration: segData.estimatedDuration,
          estimatedCost: segData.estimatedCost,
          recommendedMode: segData.recommendedMode,
          selectedMode: segData.recommendedMode
        });
        existingSegments.push(created);
      }
    }

    return existingSegments.map((s) => ({
      id: s.id,
      from: s.fromCity,
      to: s.toCity,
      estimatedDistance: s.estimatedDistance,
      estimatedDuration: s.estimatedDuration,
      estimatedCost: s.estimatedCost,
      recommendedMode: s.recommendedMode,
      selectedMode: s.selectedMode
    }));
  }

  /**
   * 6. Transport Mode Options
   */
  async getTravelSegmentOptions(tripId, segmentId, userId) {
    await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);
    const segment = await travelSegmentRepository.findById(segmentId);

    if (!segment || segment.tripId !== Number(tripId)) {
      throw ApiError.notFound('Travel segment not found for this trip.');
    }

    const calc = calculateTravelSegment(segment.fromCity, segment.toCity);
    return calc.options;
  }

  /**
   * 7. Select Transport Option
   */
  async selectTransportOption(tripId, segmentId, userId, selectedMode) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR']);
    const segment = await travelSegmentRepository.findById(segmentId);

    if (!segment || segment.tripId !== Number(tripId)) {
      throw ApiError.notFound('Travel segment not found for this trip.');
    }

    const calc = calculateTravelSegment(segment.fromCity, segment.toCity);
    const targetMode = selectedMode.toUpperCase();
    const option = calc.options.find((o) => o.mode === targetMode);

    if (!option) {
      throw ApiError.badRequest(`Transport mode ${selectedMode} is not available for this segment.`);
    }

    const updated = await travelSegmentRepository.update(segment.id, {
      selectedMode: targetMode,
      estimatedCost: option.estimatedCost,
      estimatedDuration: option.estimatedDuration
    });

    // Activity Log
    await tripActivityLogRepository.create({
      tripId: trip.id,
      userId,
      action: 'TRANSPORT_MODE_SELECTED',
      description: `Selected ${targetMode} for travel between ${segment.fromCity} and ${segment.toCity} (₹${option.estimatedCost}, ${option.estimatedDuration} hrs).`
    });

    return updated;
  }

  /**
   * 8. Activity Day Optimization
   */
  async optimizeDayActivities(tripId, dayId, userId) {
    await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);
    const day = await dayRepository.findById(dayId);

    if (!day || day.tripId !== Number(tripId)) {
      throw ApiError.notFound('Day not found in this trip.');
    }

    const dayActivities = await dayActivityRepository.findByDayId(day.id);
    const enrichedActs = await Promise.all(
      dayActivities.map(async (da) => {
        const meta = await activityRepository.findById(da.activityId);
        return {
          ...da,
          activity: meta
        };
      })
    );

    return optimizeDayActivities(enrichedActs);
  }

  /**
   * 9. Apply Activity Day Optimization
   */
  async applyDayOptimization(tripId, dayId, userId, activityOrder = []) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR']);
    const day = await dayRepository.findById(dayId);

    if (!day || day.tripId !== Number(tripId)) {
      throw ApiError.notFound('Day not found in this trip.');
    }

    const optimization = await this.optimizeDayActivities(trip.id, day.id, userId);

    // Apply suggested start & end times and order
    for (const opt of optimization.optimizedOrder) {
      await dayActivityRepository.update(opt.id, {
        order: opt.suggestedOrder,
        startTime: opt.suggestedStartTime,
        endTime: opt.suggestedEndTime
      });
    }

    await tripActivityLogRepository.create({
      tripId: trip.id,
      userId,
      action: 'DAY_ACTIVITIES_OPTIMIZED',
      description: `Optimized activity schedule for Day ${day.dayNumber} (${day.date}).`
    });

    return dayActivityRepository.findByDayId(day.id);
  }

  /**
   * 10. Route Conflict Detection
   */
  async getRouteConflicts(tripId, userId) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);
    const sections = await this._getEnrichedSections(trip.id);
    const days = await dayRepository.findByTripId(trip.id);

    const daysWithActivities = await Promise.all(
      days.map(async (d) => {
        const acts = await dayActivityRepository.findByDayId(d.id);
        return {
          ...d,
          activities: acts
        };
      })
    );

    const travelSegments = await travelSegmentRepository.findByTripId(trip.id);

    const conflicts = detectRouteConflicts({
      trip,
      sections,
      daysWithActivities,
      travelSegments
    });

    return {
      tripId: trip.id,
      totalConflicts: conflicts.length,
      conflicts
    };
  }

  /**
   * 11. Smart Route Recommendations
   */
  async getRouteRecommendations(tripId, userId) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);
    const sections = await this._getEnrichedSections(trip.id);
    const recommendations = [];

    // 1. Check Route Optimization Potential
    if (sections.length >= 3) {
      const opt = findOptimalRoute(sections);
      if (opt.changes.length > 0 && opt.estimatedImprovement.travelTimeSaved > 0) {
        recommendations.push({
          type: 'ROUTE_OPTIMIZATION',
          title: `Optimized City Sequence Available`,
          description: `Reordering cities to ${opt.optimizedRoute.map((s) => s.cityName).join(' → ')} could save ~${opt.estimatedImprovement.travelTimeSaved} hours of travel time and ₹${opt.estimatedImprovement.estimatedCostSaved}.`,
          priority: 'HIGH',
          potentialSavings: {
            time: opt.estimatedImprovement.travelTimeSaved,
            cost: opt.estimatedImprovement.estimatedCostSaved
          }
        });
      }
    }

    // 2. Transport Mode Recommendations
    const segments = await travelSegmentRepository.findByTripId(trip.id);
    for (const seg of segments) {
      const calc = calculateTravelSegment(seg.fromCity, seg.toCity);
      const trainOpt = calc.options.find((o) => o.mode === 'TRAIN');
      const flightOpt = calc.options.find((o) => o.mode === 'FLIGHT');

      if (seg.selectedMode === 'FLIGHT' && trainOpt && flightOpt && trainOpt.estimatedDuration <= 6) {
        const saved = flightOpt.estimatedCost - trainOpt.estimatedCost;
        if (saved > 1000) {
          recommendations.push({
            type: 'TRANSPORT_SAVINGS',
            title: `Consider Train from ${seg.fromCity} to ${seg.toCity}`,
            description: `Train travel takes only ${trainOpt.estimatedDuration} hrs and could save ₹${saved} compared to flights.`,
            priority: 'MEDIUM',
            potentialSavings: {
              time: 0,
              cost: saved
            }
          });
        }
      }
    }

    // 3. Pacing Recommendations
    for (const s of sections) {
      if (s.days < 2 && sections.length > 1) {
        recommendations.push({
          type: 'PACING',
          title: `Short Stay in ${s.cityName}`,
          description: `You only have 1 day planned in ${s.cityName}. Consider adding 1 more day to explore comfortably without rushing.`,
          priority: 'LOW',
          potentialSavings: null
        });
      }
    }

    return {
      tripId: trip.id,
      totalRecommendations: recommendations.length,
      recommendations
    };
  }

  /**
   * 12. Route Score & Breakdown
   */
  async getRouteScore(tripId, userId) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);
    const sections = await this._getEnrichedSections(trip.id);

    const routeMetrics = calculateRouteMetrics(sections);
    const optimal = findOptimalRoute(sections);
    const optimalMetrics = calculateRouteMetrics(optimal.optimizedRoute);

    const conflictsRes = await this.getRouteConflicts(trip.id, userId);
    const totalDays = sections.reduce((sum, s) => sum + s.days, 0);

    return calculateRouteScore({
      routeMetrics,
      optimalMetrics,
      conflicts: conflictsRes.conflicts,
      totalBudget: Number(trip.totalBudget || 0),
      totalDays
    });
  }
}

module.exports = new RouteService();
