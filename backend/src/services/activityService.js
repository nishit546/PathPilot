const activityRepository = require('../repositories/activityRepository');
const dayActivityRepository = require('../repositories/dayActivityRepository');
const dayRepository = require('../repositories/dayRepository');
const tripSectionRepository = require('../repositories/tripSectionRepository');
const tripRepository = require('../repositories/tripRepository');
const cityRepository = require('../repositories/cityRepository');
const tripActivityLogRepository = require('../repositories/tripActivityLogRepository');
const tripAccessService = require('./tripAccessService');
const ApiError = require('../utils/ApiError');

/**
 * Checks whether two time windows (HH:mm) overlap.
 */
const isTimeConflict = (start1, end1, start2, end2) => {
  if (!start1 || !end1 || !start2 || !end2) return false;
  return start1 < end2 && end1 > start2;
};

class ActivityService {
  async getAllActivities(filters) {
    return activityRepository.findAll(filters);
  }

  async getActivityById(id) {
    const activity = await activityRepository.findById(id);
    if (!activity) {
      throw ApiError.notFound('Activity not found.');
    }
    const city = await cityRepository.findById(activity.cityId);
    return {
      ...activity,
      city: city || null
    };
  }

  async getDayActivities(dayId, userId) {
    const day = await dayRepository.findById(dayId);
    if (!day) {
      throw ApiError.notFound('Day not found.');
    }

    const { trip } = await tripAccessService.requirePermission(day.tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);

    const items = await dayActivityRepository.findByDayId(dayId);
    const populated = await Promise.all(
      items.map(async (item) => {
        const meta = await activityRepository.findById(item.activityId);
        const effectiveCost = item.customCost !== null && item.customCost !== undefined
          ? item.customCost
          : (meta ? meta.estimatedCost : 0);
        return {
          ...item,
          effectiveCost,
          activity: meta || null
        };
      })
    );

    return populated;
  }

  async assignDayActivity(dayId, userId, data) {
    const day = await dayRepository.findById(dayId);
    if (!day) {
      throw ApiError.notFound('Day not found.');
    }

    const { trip } = await tripAccessService.requirePermission(day.tripId, userId, ['OWNER', 'EDITOR']);

    const masterActivity = await activityRepository.findById(data.activityId);
    if (!masterActivity) {
      throw ApiError.notFound(`Master activity with ID ${data.activityId} not found.`);
    }

    // Time conflict check
    if (data.startTime && data.endTime) {
      const existing = await dayActivityRepository.findByDayId(day.id);
      for (const act of existing) {
        if (act.startTime && act.endTime) {
          if (isTimeConflict(data.startTime, data.endTime, act.startTime, act.endTime)) {
            throw ApiError.conflict('Activity time conflicts with an existing activity.');
          }
        }
      }
    }

    const created = await dayActivityRepository.create({
      ...data,
      dayId: day.id
    });

    const effectiveCost = created.customCost !== null && created.customCost !== undefined
      ? created.customCost
      : masterActivity.estimatedCost;

    // Record activity log
    await tripActivityLogRepository.create({
      tripId: trip.id,
      userId,
      action: 'ACTIVITY_SCHEDULED',
      description: `Scheduled "${masterActivity.name}" for Day ${day.dayNumber} (${day.date})`
    });

    return {
      ...created,
      effectiveCost,
      activity: masterActivity
    };
  }

  async updateDayActivity(id, userId, data) {
    const dayActivity = await dayActivityRepository.findById(id);
    if (!dayActivity) {
      throw ApiError.notFound('Scheduled activity not found.');
    }

    const day = await dayRepository.findById(dayActivity.dayId);
    if (!day) {
      throw ApiError.notFound('Parent day not found.');
    }

    const { trip } = await tripAccessService.requirePermission(day.tripId, userId, ['OWNER', 'EDITOR']);

    if (data.activityId) {
      const master = await activityRepository.findById(data.activityId);
      if (!master) {
        throw ApiError.notFound(`Activity with ID ${data.activityId} not found.`);
      }
    }

    const newStart = data.startTime !== undefined ? data.startTime : dayActivity.startTime;
    const newEnd = data.endTime !== undefined ? data.endTime : dayActivity.endTime;

    if (newStart && newEnd) {
      const existing = await dayActivityRepository.findByDayId(day.id);
      for (const act of existing) {
        if (act.id !== dayActivity.id && act.startTime && act.endTime) {
          if (isTimeConflict(newStart, newEnd, act.startTime, act.endTime)) {
            throw ApiError.conflict('Activity time conflicts with an existing activity.');
          }
        }
      }
    }

    const updated = await dayActivityRepository.update(id, data);
    const masterActivity = await activityRepository.findById(updated.activityId);
    const effectiveCost = updated.customCost !== null && updated.customCost !== undefined
      ? updated.customCost
      : (masterActivity ? masterActivity.estimatedCost : 0);

    // Record activity log
    await tripActivityLogRepository.create({
      tripId: trip.id,
      userId,
      action: 'ACTIVITY_UPDATED',
      description: `Updated scheduled activity "${masterActivity ? masterActivity.name : ''}" on Day ${day.dayNumber}`
    });

    return {
      ...updated,
      effectiveCost,
      activity: masterActivity || null
    };
  }

  async deleteDayActivity(id, userId) {
    const dayActivity = await dayActivityRepository.findById(id);
    if (!dayActivity) {
      throw ApiError.notFound('Scheduled activity not found.');
    }

    const day = await dayRepository.findById(dayActivity.dayId);
    if (!day) {
      throw ApiError.notFound('Parent day not found.');
    }

    const { trip } = await tripAccessService.requirePermission(day.tripId, userId, ['OWNER', 'EDITOR']);
    const masterActivity = await activityRepository.findById(dayActivity.activityId);

    await dayActivityRepository.delete(id);

    // Record activity log
    await tripActivityLogRepository.create({
      tripId: trip.id,
      userId,
      action: 'ACTIVITY_DELETED',
      description: `Removed activity "${masterActivity ? masterActivity.name : ''}" from Day ${day.dayNumber}`
    });

    return { message: 'Scheduled activity removed successfully.' };
  }

  async reorderDayActivities(dayId, userId, activityIds) {
    const day = await dayRepository.findById(dayId);
    if (!day) {
      throw ApiError.notFound('Day not found.');
    }

    const { trip } = await tripAccessService.requirePermission(day.tripId, userId, ['OWNER', 'EDITOR']);

    const existing = await dayActivityRepository.findByDayId(day.id);
    const existingIds = existing.map(a => a.id);

    const uniqueIds = new Set(activityIds.map(String));
    const strExistingIds = existingIds.map(String);
    if (
      uniqueIds.size !== activityIds.length ||
      activityIds.length !== existingIds.length ||
      !activityIds.every(id => strExistingIds.includes(String(id)))
    ) {
      throw ApiError.badRequest('activityIds must include all scheduled activity IDs for this day with no duplicates or invalid IDs.');
    }

    const reordered = await dayActivityRepository.reorder(dayId, activityIds);
    return reordered;
  }
}

module.exports = new ActivityService();
