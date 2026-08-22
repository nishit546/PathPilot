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
const imageService = require('./imageService');
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

  async _enrichTripCoverImage(trip) {
    if (!trip) return trip;
    const defaultParisUrl = '1502602898657-3e91760cbb34';
    let currentImage = trip.coverImage || trip.coverPhoto || trip.cover_image_url;

    // Return if trip already has a unique non-default cover image
    if (currentImage && !currentImage.includes(defaultParisUrl)) {
      return trip;
    }

    let resolvedImage = null;

    // 1. Check sections for a city image
    try {
      const sections = await tripSectionRepository.findByTripId(trip.id);
      if (sections && sections.length > 0) {
        for (const sec of sections) {
          if (sec.cityId) {
            const city = await cityRepository.findById(sec.cityId);
            if (city && (city.imageUrl || city.image_url)) {
              resolvedImage = city.imageUrl || city.image_url;
              break;
            }
          }
        }
      }
    } catch (err) {
      // Ignore section lookup failure
    }

    // 2. Extract location keywords from trip title / description
    if (!resolvedImage) {
      const text = `${trip.title || trip.name || ''} ${trip.description || ''}`;
      const locations = ['Jaipur', 'Varanasi', 'Manali', 'Goa', 'Kochi', 'Leh', 'Udaipur', 'Rishikesh', 'Amritsar', 'Agra', 'Tokyo', 'Kyoto', 'Paris', 'Rome', 'Dubai', 'Singapore', 'London', 'Zurich', 'Sydney', 'Bali', 'Bangkok'];
      const foundLoc = locations.find(loc => text.toLowerCase().includes(loc.toLowerCase()));

      if (foundLoc) {
        resolvedImage = await imageService.getDestinationImage(foundLoc);
      } else {
        const cleanTitle = (trip.title || trip.name || 'Travel').split(':')[0].split('(')[0].trim();
        resolvedImage = await imageService.getDestinationImage(cleanTitle);
      }
    }

    if (resolvedImage) {
      try {
        await tripRepository.update(trip.id, { coverPhoto: resolvedImage, coverImage: resolvedImage });
      } catch (err) {
        // Silently ignore DB update error
      }
      return {
        ...trip,
        coverPhoto: resolvedImage,
        coverImage: resolvedImage,
        cover_image_url: resolvedImage
      };
    }

    return trip;
  }

  async getUserTrips(userId, query = {}) {
    if (query.status) {
      const targetStatus = query.status.toUpperCase();
      const allUserTrips = await tripRepository.findByUserId(userId, { ...query, limit: 1000, page: 1 });
      
      const enriched = await Promise.all(allUserTrips.trips.map(t => this._enrichTripCoverImage(t)));
      const filtered = enriched
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
    const enriched = await Promise.all(result.trips.map(t => this._enrichTripCoverImage(t)));
    const tripsWithStatus = enriched.map(t => ({
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
    const enriched = await Promise.all(result.trips.map(t => this._enrichTripCoverImage(t)));
    const tripsWithStatus = enriched.map(t => ({
      ...t,
      status: calculateTripStatus(t.startDate, t.endDate)
    }));

    return {
      trips: tripsWithStatus,
      total: result.total,
      page: result.page || 1,
      limit: result.limit || 20
    };
  }

  async getTripById(tripId, currentUserId) {
    const { trip: rawTrip, role } = await tripAccessService.requirePermission(tripId, currentUserId, ['OWNER', 'EDITOR', 'VIEWER']);
    const trip = await this._enrichTripCoverImage(rawTrip);

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
