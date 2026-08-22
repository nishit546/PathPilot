const tripRepository = require('../repositories/tripRepository');
const tripSectionRepository = require('../repositories/tripSectionRepository');
const dayRepository = require('../repositories/dayRepository');
const dayActivityRepository = require('../repositories/dayActivityRepository');
const activityRepository = require('../repositories/activityRepository');
const cityRepository = require('../repositories/cityRepository');
const expenseRepository = require('../repositories/expenseRepository');
const sharedTripRepository = require('../repositories/sharedTripRepository');
const ApiError = require('../utils/ApiError');
const { parsePagination } = require('../utils/pagination');

const calculateTripStatus = (startDate, endDate) => {
  const today = new Date().toISOString().split('T')[0];
  if (today < startDate) return 'UPCOMING';
  if (today > endDate) return 'COMPLETED';
  return 'ONGOING';
};

class TripService {
  calculateTripStatus(startDate, endDate) {
    return calculateTripStatus(startDate, endDate);
  }

  async getUserTrips(userId, query = {}) {
    // If status filter is present, we fetch all user trips matching other criteria, calculate status, filter, then paginate
    if (query.status) {
      const targetStatus = query.status.toUpperCase();
      const allUserTrips = await tripRepository.findByUserId(userId, { ...query, limit: 1000, page: 1 });
      
      const filtered = allUserTrips.trips
        .map(t => ({
          ...t,
          status: calculateTripStatus(t.startDate, t.endDate)
        }))
        .filter(t => t.status === targetStatus);

      const { page, limit, offset } = parsePagination(query);
      const paginated = filtered.slice(offset, offset + limit);

      return {
        trips: paginated,
        total: filtered.length,
        page,
        limit
      };
    }

    const result = await tripRepository.findByUserId(userId, query);
    const tripsWithStatus = result.trips.map(t => ({
      ...t,
      status: calculateTripStatus(t.startDate, t.endDate)
    }));

    return {
      trips: tripsWithStatus,
      total: result.total,
      page: result.page,
      limit: result.limit
    };
  }

  async getPublicTrips(query = {}) {
    const result = await tripRepository.findPublicTrips(query);
    const tripsWithStatus = result.trips.map(t => ({
      ...t,
      status: calculateTripStatus(t.startDate, t.endDate)
    }));

    return {
      trips: tripsWithStatus,
      total: result.total,
      page: result.page,
      limit: result.limit
    };
  }

  async getTripById(tripId, currentUserId) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      throw ApiError.notFound('Trip not found.');
    }

    // Authorization check for private trips
    if (trip.visibility === 'PRIVATE' && (!currentUserId || trip.userId !== Number(currentUserId))) {
      throw ApiError.forbidden('You do not have permission to view this private trip.');
    }

    const sections = await tripSectionRepository.findByTripId(trip.id);
    const sectionsWithDetails = await Promise.all(
      sections.map(async (section) => {
        const city = await cityRepository.findById(section.cityId);
        const days = await dayRepository.findBySectionId(section.id);

        const daysWithActivities = await Promise.all(
          days.map(async (day) => {
            const dayActivities = await dayActivityRepository.findByDayId(day.id);
            const activitiesWithMeta = await Promise.all(
              dayActivities.map(async (da) => {
                const activityMeta = await activityRepository.findById(da.activityId);
                return {
                  ...da,
                  activity: activityMeta || null
                };
              })
            );
            return {
              ...day,
              activities: activitiesWithMeta
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

    const expenses = await expenseRepository.findByTripId(trip.id);
    const shareInfo = await sharedTripRepository.findByTripId(trip.id);

    return {
      ...trip,
      status: calculateTripStatus(trip.startDate, trip.endDate),
      sections: sectionsWithDetails,
      expenses,
      shared: shareInfo ? { isShared: true, shareToken: shareInfo.shareToken } : { isShared: false }
    };
  }

  async createTrip(userId, tripData) {
    if (new Date(tripData.startDate) > new Date(tripData.endDate)) {
      throw ApiError.badRequest('Trip startDate cannot be after endDate.');
    }

    const created = await tripRepository.create({
      ...tripData,
      userId
    });

    return {
      ...created,
      status: calculateTripStatus(created.startDate, created.endDate)
    };
  }

  async updateTrip(tripId, userId, updateData) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      throw ApiError.notFound('Trip not found.');
    }

    if (trip.userId !== Number(userId)) {
      throw ApiError.forbidden('You do not have permission to modify this trip.');
    }

    const effectiveStart = updateData.startDate || trip.startDate;
    const effectiveEnd = updateData.endDate || trip.endDate;

    if (new Date(effectiveStart) > new Date(effectiveEnd)) {
      throw ApiError.badRequest('Trip startDate cannot be after endDate.');
    }

    const updated = await tripRepository.update(tripId, updateData);
    return {
      ...updated,
      status: calculateTripStatus(updated.startDate, updated.endDate)
    };
  }

  async deleteTrip(tripId, userId) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      throw ApiError.notFound('Trip not found.');
    }

    if (trip.userId !== Number(userId)) {
      throw ApiError.forbidden('You do not have permission to delete this trip.');
    }

    // Cascade deletions
    const sections = await tripSectionRepository.findByTripId(trip.id);
    for (const s of sections) {
      const days = await dayRepository.findBySectionId(s.id);
      for (const d of days) {
        await dayActivityRepository.deleteByDayId(d.id);
      }
      await dayRepository.deleteBySectionId(s.id);
    }
    await tripSectionRepository.deleteByTripId(trip.id);
    await expenseRepository.deleteByTripId(trip.id);
    await sharedTripRepository.deleteByTripId(trip.id);
    await tripRepository.delete(trip.id);

    return { message: 'Trip and all associated itinerary items deleted successfully.' };
  }
}

module.exports = new TripService();
