const tripRepository = require('../repositories/tripRepository');
const tripSectionRepository = require('../repositories/tripSectionRepository');
const dayRepository = require('../repositories/dayRepository');
const dayActivityRepository = require('../repositories/dayActivityRepository');
const activityRepository = require('../repositories/activityRepository');
const cityRepository = require('../repositories/cityRepository');
const expenseRepository = require('../repositories/expenseRepository');
const sharedTripRepository = require('../repositories/sharedTripRepository');
const tripCollaboratorRepository = require('../repositories/tripCollaboratorRepository');
const tripActivityLogRepository = require('../repositories/tripActivityLogRepository');
const tripAccessService = require('./tripAccessService');
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
      page,
      limit
    };
  }

  async getTripById(tripId, currentUserId) {
    const { trip, role } = await tripAccessService.requirePermission(tripId, currentUserId, ['OWNER', 'EDITOR', 'VIEWER']);

    const sections = await tripSectionRepository.findByTripId(trip.id);
    const sectionsWithDetails = await Promise.all(
      sections.map(async (section) => {
        const city = await cityRepository.findById(section.cityId);
        const days = await dayRepository.findBySectionId(section.id);

        const daysWithActivities = await Promise.all(
          days.map(async (day) => {
            const dayActivities = await dayActivityRepository.findByDayId(day.id);
            return {
              ...day,
              activities: dayActivities
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
    const collaborators = await tripCollaboratorRepository.findByTripId(trip.id);

    return {
      ...trip,
      userRole: role,
      status: calculateTripStatus(trip.startDate, trip.endDate),
      sections: sectionsWithDetails,
      expenses,
      collaboratorCount: collaborators.length,
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

    // Record activity log
    await tripActivityLogRepository.create({
      tripId: created.id,
      userId,
      action: 'TRIP_CREATED',
      description: `Created trip "${created.name}"`
    });

    return {
      ...created,
      status: calculateTripStatus(created.startDate, created.endDate)
    };
  }

  async updateTrip(tripId, userId, updateData) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR']);

    const effectiveStart = updateData.startDate || trip.startDate;
    const effectiveEnd = updateData.endDate || trip.endDate;

    if (new Date(effectiveStart) > new Date(effectiveEnd)) {
      throw ApiError.badRequest('Trip startDate cannot be after endDate.');
    }

    const updated = await tripRepository.update(trip.id, updateData);

    // Record activity log
    await tripActivityLogRepository.create({
      tripId: trip.id,
      userId,
      action: 'TRIP_UPDATED',
      description: `Updated trip information`
    });

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

    // Strictly owner can delete trip
    if (String(trip.userId) !== String(userId)) {
      throw ApiError.forbidden('Only the trip owner can delete this trip.');
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
    await tripCollaboratorRepository.deleteByTripId(trip.id);
    await tripActivityLogRepository.deleteByTripId(trip.id);
    const sharedExpenseRepository = require('../repositories/sharedExpenseRepository');
    const sharedExpenseSplitRepository = require('../repositories/sharedExpenseSplitRepository');
    const settlementRepository = require('../repositories/settlementRepository');
    const packingRepository = require('../repositories/packingRepository');
    const travelDocumentRepository = require('../repositories/travelDocumentRepository');
    const preparationTaskRepository = require('../repositories/preparationTaskRepository');
    await sharedExpenseSplitRepository.deleteByTripId(trip.id);
    await sharedExpenseRepository.deleteByTripId(trip.id);
    await settlementRepository.deleteByTripId(trip.id);
    await packingRepository.deleteByTripId(trip.id);
    await travelDocumentRepository.deleteByTripId(trip.id);
    await preparationTaskRepository.deleteByTripId(trip.id);
    await tripRepository.delete(trip.id);

    return { message: 'Trip and all associated itinerary items deleted successfully.' };
  }
}

module.exports = new TripService();
