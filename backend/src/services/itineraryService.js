const tripRepository = require('../repositories/tripRepository');
const tripSectionRepository = require('../repositories/tripSectionRepository');
const dayRepository = require('../repositories/dayRepository');
const dayActivityRepository = require('../repositories/dayActivityRepository');
const cityRepository = require('../repositories/cityRepository');
const activityRepository = require('../repositories/activityRepository');
const expenseRepository = require('../repositories/expenseRepository');
const tripActivityLogRepository = require('../repositories/tripActivityLogRepository');
const tripAccessService = require('./tripAccessService');
const ApiError = require('../utils/ApiError');

/**
 * Generate an array of YYYY-MM-DD date strings between start and end inclusive.
 */
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

class ItineraryService {
  async getTripSections(tripId, userId) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);

    const sections = await tripSectionRepository.findByTripId(trip.id);
    const populated = await Promise.all(
      sections.map(async (section) => {
        const city = await cityRepository.findById(section.cityId);
        const days = await dayRepository.findBySectionId(section.id);
        const daysWithActivities = await Promise.all(
          days.map(async (day) => {
            const dayActs = await dayActivityRepository.findByDayId(day.id);
            const populatedActs = await Promise.all(
              dayActs.map(async (da) => {
                const actMeta = await activityRepository.findById(da.activityId);
                return {
                  ...da,
                  name: actMeta?.name || 'Activity',
                  activity: actMeta || null
                };
              })
            );
            return {
              ...day,
              dayActivities: populatedActs,
              activities: populatedActs
            };
          })
        );
        return {
          ...section,
          city: city || null,
          days: daysWithActivities
        };
      })
    );

    return populated;
  }

  async getSectionById(sectionId, userId) {
    const section = await tripSectionRepository.findById(sectionId);
    if (!section) {
      throw ApiError.notFound('Trip section not found.');
    }

    const { trip } = await tripAccessService.requirePermission(section.tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);

    const city = await cityRepository.findById(section.cityId);
    const days = await dayRepository.findBySectionId(section.id);

    const daysWithActivities = await Promise.all(
      days.map(async (day) => {
        const dayActs = await dayActivityRepository.findByDayId(day.id);
        const populatedActs = await Promise.all(
          dayActs.map(async (da) => {
            const actMeta = await activityRepository.findById(da.activityId);
            return {
              ...da,
              name: actMeta?.name || 'Activity',
              activity: actMeta || null
            };
          })
        );
        return {
          ...day,
          dayActivities: populatedActs,
          activities: populatedActs
        };
      })
    );

    return {
      ...section,
      city: city || null,
      days: daysWithActivities
    };
  }

  async createSection(tripId, userId, sectionData) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR']);

    const city = await cityRepository.findById(sectionData.cityId);
    if (!city) {
      throw ApiError.notFound(`City with ID ${sectionData.cityId} does not exist.`);
    }

    // Validate section dates are within trip range
    if (sectionData.startDate < trip.startDate || sectionData.endDate > trip.endDate) {
      throw ApiError.badRequest(
        `Section dates (${sectionData.startDate} to ${sectionData.endDate}) must fall within trip dates (${trip.startDate} to ${trip.endDate}).`
      );
    }

    if (sectionData.startDate > sectionData.endDate) {
      throw ApiError.badRequest('Section startDate cannot be after endDate.');
    }

    const createdSection = await tripSectionRepository.create({
      ...sectionData,
      tripId: trip.id
    });

    // Auto-generate Day records
    const dateRange = getDateRange(createdSection.startDate, createdSection.endDate);
    const dayRecordsToCreate = dateRange.map((date, index) => ({
      sectionId: createdSection.id,
      tripId: trip.id,
      date,
      dayNumber: index + 1
    }));

    const createdDays = await dayRepository.createBulk(dayRecordsToCreate);

    // Auto-populate 1-2 location-matching activities from the destination city for each created day
    const cityActivities = await activityRepository.findByCityId(city.id);
    if (cityActivities && cityActivities.length > 0) {
      for (let i = 0; i < createdDays.length; i++) {
        const day = createdDays[i];
        const act = cityActivities[i % cityActivities.length];
        if (act) {
          try {
            await dayActivityRepository.create({
              dayId: day.id,
              activityId: act.id,
              activityOrder: 1,
              plannedTime: '10:00:00',
              notes: `Explore ${act.name} in ${city.name}`,
              expenseAmount: act.estimatedCost || 0
            });
          } catch (err) {
            console.error('Failed to auto-assign day activity:', err);
          }
        }
      }
    }

    // Re-fetch populated section with day activities
    return this.getSectionById(createdSection.id, userId);
  }

  async updateSection(sectionId, userId, updateData) {
    const section = await tripSectionRepository.findById(sectionId);
    if (!section) {
      throw ApiError.notFound('Trip section not found.');
    }

    const { trip } = await tripAccessService.requirePermission(section.tripId, userId, ['OWNER', 'EDITOR']);

    if (updateData.cityId) {
      const city = await cityRepository.findById(updateData.cityId);
      if (!city) {
        throw ApiError.notFound(`City with ID ${updateData.cityId} does not exist.`);
      }
    }

    const newStart = updateData.startDate || section.startDate;
    const newEnd = updateData.endDate || section.endDate;

    if (newStart < trip.startDate || newEnd > trip.endDate) {
      throw ApiError.badRequest(
        `Section dates (${newStart} to ${newEnd}) must fall within trip dates (${trip.startDate} to ${trip.endDate}).`
      );
    }

    if (newStart > newEnd) {
      throw ApiError.badRequest('Section startDate cannot be after endDate.');
    }

    const updatedSection = await tripSectionRepository.update(sectionId, updateData);

    // If dates changed, synchronize days
    if (updateData.startDate || updateData.endDate) {
      const existingDays = await dayRepository.findBySectionId(section.id);
      const newDateRange = getDateRange(newStart, newEnd);

      // Remove days outside new range
      for (const day of existingDays) {
        if (!newDateRange.includes(day.date)) {
          await dayActivityRepository.deleteByDayId(day.id);
          await expenseRepository.deleteByDayId(day.id);
          await dayRepository.delete(day.id);
        }
      }

      // Add days for new dates
      const remainingDays = await dayRepository.findBySectionId(section.id);
      const existingDates = remainingDays.map(d => d.date);

      for (let i = 0; i < newDateRange.length; i++) {
        const dStr = newDateRange[i];
        if (!existingDates.includes(dStr)) {
          await dayRepository.create({
            sectionId: section.id,
            tripId: trip.id,
            date: dStr,
            dayNumber: i + 1
          });
        }
      }

      // Renumber day numbers sequentially
      const allCurrentDays = await dayRepository.findBySectionId(section.id);
      allCurrentDays.sort((a, b) => new Date(a.date) - new Date(b.date));
      for (let i = 0; i < allCurrentDays.length; i++) {
        allCurrentDays[i].dayNumber = i + 1;
      }
    }

    const finalDays = await dayRepository.findBySectionId(section.id);
    const city = await cityRepository.findById(updatedSection.cityId);

    // Record activity log
    await tripActivityLogRepository.create({
      tripId: trip.id,
      userId,
      action: 'SECTION_UPDATED',
      description: `Updated destination section ${city ? city.name : ''}`
    });

    return {
      ...updatedSection,
      city: city || null,
      days: finalDays
    };
  }

  async deleteSection(sectionId, userId) {
    const section = await tripSectionRepository.findById(sectionId);
    if (!section) {
      throw ApiError.notFound('Trip section not found.');
    }

    const { trip } = await tripAccessService.requirePermission(section.tripId, userId, ['OWNER', 'EDITOR']);
    const city = await cityRepository.findById(section.cityId);

    const days = await dayRepository.findBySectionId(section.id);
    for (const d of days) {
      await dayActivityRepository.deleteByDayId(d.id);
      await expenseRepository.deleteByDayId(d.id);
    }
    await dayRepository.deleteBySectionId(section.id);
    await expenseRepository.deleteBySectionId(section.id);
    await tripSectionRepository.delete(section.id);

    // Record activity log
    await tripActivityLogRepository.create({
      tripId: trip.id,
      userId,
      action: 'SECTION_DELETED',
      description: `Removed destination section ${city ? city.name : ''}`
    });

    return { message: 'Trip section and its days deleted successfully.' };
  }

  async reorderSections(tripId, userId, sectionIds) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR']);

    const existing = await tripSectionRepository.findByTripId(trip.id);
    const existingIds = existing.map(s => s.id);

    // Validate that all sectionIds match existing section IDs without duplicates
    const uniqueIds = new Set(sectionIds.map(String));
    const strExistingIds = existingIds.map(String);
    if (
      uniqueIds.size !== sectionIds.length ||
      sectionIds.length !== existingIds.length ||
      !sectionIds.every(id => strExistingIds.includes(String(id)))
    ) {
      throw ApiError.badRequest('sectionIds must include all existing section IDs for this trip with no duplicates or invalid IDs.');
    }

    const reordered = await tripSectionRepository.reorder(trip.id, sectionIds);
    return reordered;
  }

  async getSectionDays(sectionId, userId) {
    const section = await tripSectionRepository.findById(sectionId);
    if (!section) {
      throw ApiError.notFound('Trip section not found.');
    }

    const { trip } = await tripAccessService.requirePermission(section.tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);

    const days = await dayRepository.findBySectionId(sectionId);
    const daysWithActivities = await Promise.all(
      days.map(async (day) => {
        const activities = await dayActivityRepository.findByDayId(day.id);
        const detailed = await Promise.all(
          activities.map(async (da) => {
            const meta = await activityRepository.findById(da.activityId);
            return { ...da, activity: meta || null };
          })
        );
        return { ...day, activities: detailed };
      })
    );

    return daysWithActivities;
  }

  async getDayById(dayId, userId) {
    const day = await dayRepository.findById(dayId);
    if (!day) {
      throw ApiError.notFound('Day not found.');
    }

    const { trip } = await tripAccessService.requirePermission(day.tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);

    const activities = await dayActivityRepository.findByDayId(day.id);
    const detailedActivities = await Promise.all(
      activities.map(async (da) => {
        const meta = await activityRepository.findById(da.activityId);
        return { ...da, activity: meta || null };
      })
    );

    return {
      ...day,
      activities: detailedActivities
    };
  }

  async getTripDays(tripId, userId) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);
    const days = await dayRepository.findByTripId(trip.id);
    const daysWithActivities = await Promise.all(
      days.map(async (day) => {
        const activities = await dayActivityRepository.findByDayId(day.id);
        const detailed = await Promise.all(
          activities.map(async (da) => {
            const meta = await activityRepository.findById(da.activityId);
            return { ...da, activity: meta || null };
          })
        );
        return { ...day, activities: detailed };
      })
    );
    return daysWithActivities;
  }
}

module.exports = new ItineraryService();
