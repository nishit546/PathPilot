const tripRepository = require('../repositories/tripRepository');
const tripSectionRepository = require('../repositories/tripSectionRepository');
const dayRepository = require('../repositories/dayRepository');
const dayActivityRepository = require('../repositories/dayActivityRepository');
const activityRepository = require('../repositories/activityRepository');
const cityRepository = require('../repositories/cityRepository');
const tripActivityLogRepository = require('../repositories/tripActivityLogRepository');
const notificationService = require('./notificationService');
const ApiError = require('../utils/ApiError');

const calculateTripStatus = (startDate, endDate) => {
  const today = new Date().toISOString().split('T')[0];
  if (today < startDate) return 'UPCOMING';
  if (today > endDate) return 'COMPLETED';
  return 'ONGOING';
};

const getDateRange = (startDateStr, endDateStr) => {
  const dates = [];
  const current = new Date(startDateStr);
  const end = new Date(endDateStr);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
};

const addDaysToDate = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
};

class TripCloningService {
  /**
   * Deeply clones an existing trip into a new, completely independent trip.
   */
  async cloneTrip(sourceTripId, targetUserId, options = {}) {
    const sourceTrip = await tripRepository.findById(sourceTripId);
    if (!sourceTrip) {
      throw ApiError.notFound('Source trip not found.');
    }

    const newStartDate = options.startDate || sourceTrip.startDate;
    const newEndDate = options.endDate || sourceTrip.endDate;

    if (new Date(newStartDate) > new Date(newEndDate)) {
      throw ApiError.badRequest('Trip startDate cannot be after endDate.');
    }

    const targetDateRange = getDateRange(newStartDate, newEndDate);
    const targetTotalDays = targetDateRange.length;

    const sourceDateRange = getDateRange(sourceTrip.startDate, sourceTrip.endDate);
    const sourceTotalDays = sourceDateRange.length;

    const warnings = [];

    // 1. Create target trip
    const newTrip = await tripRepository.create({
      name: options.name || `${sourceTrip.name} (Copy)`,
      description: options.description !== undefined ? options.description : sourceTrip.description,
      coverPhoto: options.coverPhoto || sourceTrip.coverPhoto,
      startDate: newStartDate,
      endDate: newEndDate,
      totalBudget: options.totalBudget !== undefined ? options.totalBudget : sourceTrip.totalBudget,
      visibility: options.visibility || 'PRIVATE',
      userId: String(targetUserId)
    });

    // 2. Fetch all source itinerary structures
    const sourceSections = await tripSectionRepository.findByTripId(sourceTrip.id);
    sourceSections.sort((a, b) => a.order - b.order);

    let currentDayOffset = 0;
    let trimmedActivitiesCount = 0;

    for (let secIdx = 0; secIdx < sourceSections.length; secIdx++) {
      const srcSec = sourceSections[secIdx];
      const srcDays = await dayRepository.findBySectionId(srcSec.id);
      srcDays.sort((a, b) => new Date(a.date) - new Date(b.date));

      const secDuration = srcDays.length;

      // If new trip is already full, skip remaining sections
      if (currentDayOffset >= targetTotalDays) {
        for (const sd of srcDays) {
          const acts = await dayActivityRepository.findByDayId(sd.id);
          trimmedActivitiesCount += acts.length;
        }
        continue;
      }

      // Calculate section dates in new trip
      const secStartIdx = currentDayOffset;
      let secEndIdx = currentDayOffset + secDuration - 1;

      // If this is the last section and new trip is longer, extend last section to end of trip
      if (secIdx === sourceSections.length - 1 && secEndIdx < targetTotalDays - 1) {
        secEndIdx = targetTotalDays - 1;
      } else if (secEndIdx >= targetTotalDays) {
        secEndIdx = targetTotalDays - 1;
      }

      const secStartDate = targetDateRange[secStartIdx];
      const secEndDate = targetDateRange[secEndIdx];

      // Create new Section
      const newSection = await tripSectionRepository.create({
        tripId: newTrip.id,
        cityId: srcSec.cityId,
        startDate: secStartDate,
        endDate: secEndDate,
        budget: srcSec.budget,
        order: srcSec.order
      });

      // Create section days
      const sectionDates = getDateRange(secStartDate, secEndDate);
      const newDaysToCreate = sectionDates.map((dateStr, idx) => ({
        sectionId: newSection.id,
        tripId: newTrip.id,
        date: dateStr,
        dayNumber: secStartIdx + idx + 1
      }));

      const createdNewDays = await dayRepository.createBulk(newDaysToCreate);

      // Copy activities from source days to matching new days
      for (let dIdx = 0; dIdx < srcDays.length; dIdx++) {
        const srcDay = srcDays[dIdx];
        const srcActivities = await dayActivityRepository.findByDayId(srcDay.id);

        if (dIdx < createdNewDays.length) {
          const targetDay = createdNewDays[dIdx];
          for (const act of srcActivities) {
            await dayActivityRepository.create({
              dayId: targetDay.id,
              activityId: act.activityId,
              startTime: act.startTime,
              endTime: act.endTime,
              customCost: act.customCost,
              notes: act.notes,
              order: act.order
            });
          }
        } else {
          // Activities that exceed target section duration
          trimmedActivitiesCount += srcActivities.length;
        }
      }

      currentDayOffset = secEndIdx + 1;
    }

    if (trimmedActivitiesCount > 0) {
      warnings.push(
        `${trimmedActivitiesCount} activity items could not fit because the new trip schedule is shorter than the source.`
      );
    }

    // Record activity log for the new trip
    await tripActivityLogRepository.create({
      tripId: newTrip.id,
      userId: String(targetUserId),
      action: 'TRIP_CREATED',
      description: `Created trip "${newTrip.name}" cloned from existing itinerary`
    });

    return {
      trip: {
        ...newTrip,
        status: calculateTripStatus(newTrip.startDate, newTrip.endDate)
      },
      warnings
    };
  }

  /**
   * Creates a new trip from a template definition.
   */
  async createTripFromTemplate(template, targetUserId, options = {}) {
    const newStartDate = options.startDate;
    const newEndDate = options.endDate;

    if (!newStartDate || !newEndDate) {
      throw ApiError.badRequest('startDate and endDate are required.');
    }

    if (new Date(newStartDate) > new Date(newEndDate)) {
      throw ApiError.badRequest('Trip startDate cannot be after endDate.');
    }

    const targetDateRange = getDateRange(newStartDate, newEndDate);
    const targetTotalDays = targetDateRange.length;

    const warnings = [];

    // 1. Create target trip
    const newTrip = await tripRepository.create({
      name: options.tripName || template.name,
      description: template.description || '',
      coverPhoto: template.coverPhoto || null,
      startDate: newStartDate,
      endDate: newEndDate,
      totalBudget: options.budget !== undefined ? options.budget : (template.metadata ? template.metadata.estimatedCost : (template.estimatedBudget || 0)),
      visibility: options.visibility || 'PRIVATE',
      userId: String(targetUserId)
    });

    // 2. Process template sections
    const templateSections = template.sections || template.sectionsData || [];
    templateSections.sort((a, b) => a.order - b.order);

    let currentDayOffset = 0;
    let trimmedActivitiesCount = 0;

    for (let secIdx = 0; secIdx < templateSections.length; secIdx++) {
      const tmplSec = templateSections[secIdx];
      const secDuration = Number(tmplSec.durationDays || 1);

      if (currentDayOffset >= targetTotalDays) {
        if (tmplSec.activities) {
          trimmedActivitiesCount += tmplSec.activities.length;
        }
        continue;
      }

      const secStartIdx = currentDayOffset;
      let secEndIdx = currentDayOffset + secDuration - 1;

      if (secIdx === templateSections.length - 1 && secEndIdx < targetTotalDays - 1) {
        secEndIdx = targetTotalDays - 1;
      } else if (secEndIdx >= targetTotalDays) {
        secEndIdx = targetTotalDays - 1;
      }

      const secStartDate = targetDateRange[secStartIdx];
      const secEndDate = targetDateRange[secEndIdx];

      // Create new Section
      const newSection = await tripSectionRepository.create({
        tripId: newTrip.id,
        cityId: tmplSec.cityId,
        startDate: secStartDate,
        endDate: secEndDate,
        budget: tmplSec.budget || 0,
        order: tmplSec.order
      });

      // Create section days
      const sectionDates = getDateRange(secStartDate, secEndDate);
      const newDaysToCreate = sectionDates.map((dateStr, idx) => ({
        sectionId: newSection.id,
        tripId: newTrip.id,
        date: dateStr,
        dayNumber: secStartIdx + idx + 1
      }));

      const createdNewDays = await dayRepository.createBulk(newDaysToCreate);

      // Map template activities to new days
      const activities = tmplSec.activities || [];
      for (const act of activities) {
        const dayOffset = Number(act.dayOffset || 0);
        if (dayOffset < createdNewDays.length) {
          const targetDay = createdNewDays[dayOffset];
          await dayActivityRepository.create({
            dayId: targetDay.id,
            activityId: act.activityId,
            startTime: act.startTime,
            endTime: act.endTime,
            customCost: act.customCost,
            notes: act.notes,
            order: act.order
          });
        } else {
          trimmedActivitiesCount++;
        }
      }

      currentDayOffset = secEndIdx + 1;
    }

    if (trimmedActivitiesCount > 0) {
      warnings.push(
        `${trimmedActivitiesCount} activities were not included because the new trip duration is shorter.`
      );
    }

    // Record activity log
    await tripActivityLogRepository.create({
      tripId: newTrip.id,
      userId: String(targetUserId),
      action: 'TRIP_CREATED',
      description: `Created trip "${newTrip.name}" from template "${template.name}"`
    });

    return {
      trip: {
        ...newTrip,
        status: calculateTripStatus(newTrip.startDate, newTrip.endDate)
      },
      warnings
    };
  }
}

module.exports = new TripCloningService();
