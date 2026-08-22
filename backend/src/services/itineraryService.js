const tripRepository = require('../repositories/tripRepository');
const tripSectionRepository = require('../repositories/tripSectionRepository');
const dayRepository = require('../repositories/dayRepository');
const dayActivityRepository = require('../repositories/dayActivityRepository');
const cityRepository = require('../repositories/cityRepository');
const activityRepository = require('../repositories/activityRepository');
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
    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      throw ApiError.notFound('Trip not found.');
    }

    if (trip.visibility === 'PRIVATE' && (!userId || trip.userId !== Number(userId))) {
      throw ApiError.forbidden('You do not have access to this trip’s itinerary.');
    }

    const sections = await tripSectionRepository.findByTripId(tripId);
    const populated = await Promise.all(
      sections.map(async (section) => {
        const city = await cityRepository.findById(section.cityId);
        const days = await dayRepository.findBySectionId(section.id);
        return {
          ...section,
          city: city || null,
          days
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

    const trip = await tripRepository.findById(section.tripId);
    if (trip.visibility === 'PRIVATE' && (!userId || trip.userId !== Number(userId))) {
      throw ApiError.forbidden('You do not have access to this trip section.');
    }

    const city = await cityRepository.findById(section.cityId);
    const days = await dayRepository.findBySectionId(section.id);

    const daysWithActivities = await Promise.all(
      days.map(async (day) => {
        const activities = await dayActivityRepository.findByDayId(day.id);
        return { ...day, activities };
      })
    );

    return {
      ...section,
      city: city || null,
      days: daysWithActivities
    };
  }

  async createSection(tripId, userId, sectionData) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      throw ApiError.notFound('Trip not found.');
    }

    if (trip.userId !== Number(userId)) {
      throw ApiError.forbidden('You do not have permission to add sections to this trip.');
    }

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

    return {
      ...createdSection,
      city,
      days: createdDays
    };
  }

  async updateSection(sectionId, userId, updateData) {
    const section = await tripSectionRepository.findById(sectionId);
    if (!section) {
      throw ApiError.notFound('Trip section not found.');
    }

    const trip = await tripRepository.findById(section.tripId);
    if (trip.userId !== Number(userId)) {
      throw ApiError.forbidden('You do not have permission to update this section.');
    }

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

    const trip = await tripRepository.findById(section.tripId);
    if (trip.userId !== Number(userId)) {
      throw ApiError.forbidden('You do not have permission to delete this section.');
    }

    const days = await dayRepository.findBySectionId(section.id);
    for (const d of days) {
      await dayActivityRepository.deleteByDayId(d.id);
    }
    await dayRepository.deleteBySectionId(section.id);
    await tripSectionRepository.delete(section.id);

    return { message: 'Trip section and its days deleted successfully.' };
  }

  async reorderSections(tripId, userId, sectionIds) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      throw ApiError.notFound('Trip not found.');
    }

    if (trip.userId !== Number(userId)) {
      throw ApiError.forbidden('You do not have permission to reorder sections for this trip.');
    }

    const existing = await tripSectionRepository.findByTripId(trip.id);
    const existingIds = existing.map(s => s.id);

    // Validate that all sectionIds match existing section IDs without duplicates
    const uniqueIds = new Set(sectionIds.map(Number));
    if (
      uniqueIds.size !== sectionIds.length ||
      sectionIds.length !== existingIds.length ||
      !sectionIds.every(id => existingIds.includes(Number(id)))
    ) {
      throw ApiError.badRequest('sectionIds must include all existing section IDs for this trip with no duplicates or invalid IDs.');
    }

    const reordered = await tripSectionRepository.reorder(tripId, sectionIds);
    return reordered;
  }

  async getSectionDays(sectionId, userId) {
    const section = await tripSectionRepository.findById(sectionId);
    if (!section) {
      throw ApiError.notFound('Trip section not found.');
    }

    const trip = await tripRepository.findById(section.tripId);
    if (trip.visibility === 'PRIVATE' && (!userId || trip.userId !== Number(userId))) {
      throw ApiError.forbidden('You do not have access to this section’s days.');
    }

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

    const trip = await tripRepository.findById(day.tripId);
    if (trip.visibility === 'PRIVATE' && (!userId || trip.userId !== Number(userId))) {
      throw ApiError.forbidden('You do not have access to this day.');
    }

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
}

module.exports = new ItineraryService();
