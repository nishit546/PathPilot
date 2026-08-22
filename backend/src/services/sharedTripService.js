const crypto = require('crypto');
const sharedTripRepository = require('../repositories/sharedTripRepository');
const tripRepository = require('../repositories/tripRepository');
const tripSectionRepository = require('../repositories/tripSectionRepository');
const dayRepository = require('../repositories/dayRepository');
const dayActivityRepository = require('../repositories/dayActivityRepository');
const activityRepository = require('../repositories/activityRepository');
const cityRepository = require('../repositories/cityRepository');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/ApiError');

const calculateTripStatus = (startDate, endDate) => {
  const today = new Date().toISOString().split('T')[0];
  if (today < startDate) return 'UPCOMING';
  if (today > endDate) return 'COMPLETED';
  return 'ONGOING';
};

class SharedTripService {
  async generateShareToken(tripId, userId) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      throw ApiError.notFound('Trip not found.');
    }

    if (String(trip.userId) !== String(userId)) {
      throw ApiError.forbidden('You do not have permission to share this trip.');
    }

    const token = `share_${crypto.randomBytes(16).toString('hex')}`;
    const shareRecord = await sharedTripRepository.create({
      tripId: trip.id,
      userId,
      shareToken: token
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    return {
      tripId: trip.id,
      shareToken: shareRecord.shareToken,
      shareUrl: `${clientUrl}/shared/${shareRecord.shareToken}`,
      createdAt: shareRecord.createdAt
    };
  }

  async getSharedTrip(shareToken) {
    const shareRecord = await sharedTripRepository.findByToken(shareToken);
    if (!shareRecord) {
      throw ApiError.notFound('Shared trip link is invalid or has expired.');
    }

    const trip = await tripRepository.findById(shareRecord.tripId);
    if (!trip) {
      throw ApiError.notFound('The trip associated with this link no longer exists.');
    }

    const author = await userRepository.findById(trip.userId);
    const sections = await tripSectionRepository.findByTripId(trip.id);

    const populatedSections = await Promise.all(
      sections.map(async (section) => {
        const city = await cityRepository.findById(section.cityId);
        const days = await dayRepository.findBySectionId(section.id);

        const daysWithActivities = await Promise.all(
          days.map(async (day) => {
            const dayActivities = await dayActivityRepository.findByDayId(day.id);
            const detailed = await Promise.all(
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
              activities: detailed
            };
          })
        );

        return {
          id: section.id,
          startDate: section.startDate,
          endDate: section.endDate,
          order: section.order,
          city: city ? {
            id: city.id,
            name: city.name,
            country: city.country,
            region: city.region,
            imageUrl: city.imageUrl
          } : null,
          days: daysWithActivities
        };
      })
    );

    return {
      tripId: trip.id,
      name: trip.name,
      description: trip.description,
      coverPhoto: trip.coverPhoto,
      startDate: trip.startDate,
      endDate: trip.endDate,
      status: calculateTripStatus(trip.startDate, trip.endDate),
      author: author ? {
        firstName: author.firstName,
        lastName: author.lastName,
        profilePhoto: author.profilePhoto,
        city: author.city,
        country: author.country
      } : null,
      sections: populatedSections
    };
  }

  async revokeShareToken(tripId, userId) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      throw ApiError.notFound('Trip not found.');
    }

    if (String(trip.userId) !== String(userId)) {
      throw ApiError.forbidden('You do not have permission to modify this trip’s sharing settings.');
    }

    await sharedTripRepository.deleteByTripId(trip.id);
    return { message: 'Trip share link has been revoked successfully.' };
  }
}

module.exports = new SharedTripService();
