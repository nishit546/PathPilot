const tripRepository = require('../repositories/tripRepository');
const tripSectionRepository = require('../repositories/tripSectionRepository');
const dayRepository = require('../repositories/dayRepository');
const dayActivityRepository = require('../repositories/dayActivityRepository');
const activityRepository = require('../repositories/activityRepository');
const cityRepository = require('../repositories/cityRepository');
const sharedTripRepository = require('../repositories/sharedTripRepository');
const tripTemplateRepository = require('../repositories/tripTemplateRepository');
const templateFavoriteRepository = require('../repositories/templateFavoriteRepository');
const userRepository = require('../repositories/userRepository');
const tripCloningService = require('./tripCloningService');
const ApiError = require('../utils/ApiError');

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

class TripTemplateService {
  /**
   * Converts an existing trip into a reusable template.
   */
  async createTemplateFromTrip(tripId, userId, data) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      throw ApiError.notFound('Trip not found.');
    }

    if (String(trip.userId) !== String(userId)) {
      throw ApiError.forbidden('Only the trip owner can convert this trip into a template.');
    }

    const sections = await tripSectionRepository.findByTripId(trip.id);
    sections.sort((a, b) => a.order - b.order);

    let totalActivities = 0;
    let totalEstimatedCost = 0;
    const cityIds = new Set();

    const templateSections = [];

    for (const sec of sections) {
      cityIds.add(sec.cityId);
      const city = await cityRepository.findById(sec.cityId);
      const days = await dayRepository.findBySectionId(sec.id);
      days.sort((a, b) => new Date(a.date) - new Date(b.date));

      const secActivities = [];

      for (let dayOffset = 0; dayOffset < days.length; dayOffset++) {
        const day = days[dayOffset];
        const dayActs = await dayActivityRepository.findByDayId(day.id);
        dayActs.sort((a, b) => a.order - b.order);

        for (const da of dayActs) {
          const meta = await activityRepository.findById(da.activityId);
          const cost = da.customCost !== null && da.customCost !== undefined
            ? da.customCost
            : (meta ? meta.estimatedCost : 0);

          totalActivities++;
          totalEstimatedCost += cost;

          secActivities.push({
            activityId: da.activityId,
            activityName: meta ? meta.name : 'Unknown Activity',
            dayOffset,
            startTime: da.startTime,
            endTime: da.endTime,
            customCost: da.customCost,
            notes: da.notes,
            order: da.order
          });
        }
      }

      templateSections.push({
        cityId: sec.cityId,
        cityName: city ? city.name : 'Unknown City',
        order: sec.order,
        durationDays: days.length || 1,
        budget: sec.budget || 0,
        activities: secActivities
      });
    }

    const totalDays = getDateRange(trip.startDate, trip.endDate).length;

    const createdTemplate = await tripTemplateRepository.create({
      creatorId: String(userId),
      userId: String(userId),
      sourceTripId: trip.id,
      name: data.name || `${trip.name} Template`,
      description: data.description !== undefined ? data.description : trip.description,
      category: data.category || 'OTHER',
      coverPhoto: data.coverPhoto || trip.coverPhoto,
      isPublic: Boolean(data.isPublic),
      sections: templateSections,
      metadata: {
        totalDays,
        totalCities: cityIds.size,
        totalActivities,
        estimatedCost: totalEstimatedCost
      }
    });

    return createdTemplate;
  }

  /**
   * Retrieves templates created by the authenticated user.
   */
  async getMyTemplates(userId, query = {}) {
    return tripTemplateRepository.findByCreatorId(userId, query);
  }

  /**
   * Retrieves public templates discovery feed.
   */
  async getPublicTemplates(query = {}) {
    return tripTemplateRepository.findPublicTemplates(query);
  }

  /**
   * Retrieves a single template by ID.
   */
  async getTemplateById(id, userId = null) {
    const template = await tripTemplateRepository.findById(id);
    if (!template) {
      throw ApiError.notFound('Template not found.');
    }

    if (template.visibility === 'PRIVATE' && (!userId || String(template.userId) !== String(userId))) {
      throw ApiError.forbidden('You do not have access to this private template.');
    }

    const creator = await userRepository.findById(template.userId);
    return {
      ...template,
      creator: creator ? {
        id: creator.id,
        firstName: creator.firstName,
        lastName: creator.lastName,
        profilePhoto: creator.profilePhoto
      } : null
    };
  }

  /**
   * Updates an existing template.
   */
  async updateTemplate(id, userId, updateData) {
    const template = await tripTemplateRepository.findById(id);
    if (!template) {
      throw ApiError.notFound('Template not found.');
    }

    if (String(template.userId) !== String(userId)) {
      throw ApiError.forbidden('Only the template creator can update this template.');
    }

    const updated = await tripTemplateRepository.update(id, updateData);
    return updated;
  }

  /**
   * Deletes a template.
   */
  async deleteTemplate(id, userId) {
    const template = await tripTemplateRepository.findById(id);
    if (!template) {
      throw ApiError.notFound('Template not found.');
    }

    if (String(template.userId) !== String(userId)) {
      throw ApiError.forbidden('Only the template creator can delete this template.');
    }

    await templateFavoriteRepository.delete(template.id, userId);
    await tripTemplateRepository.delete(template.id);

    return { message: 'Template deleted successfully.' };
  }

  /**
   * Instantiates a new trip from a template.
   */
  async useTemplate(templateId, userId, useData) {
    const template = await tripTemplateRepository.findById(templateId);
    if (!template) {
      throw ApiError.notFound('Template not found.');
    }

    if (template.visibility === 'PRIVATE' && String(template.userId) !== String(userId)) {
      throw ApiError.forbidden('You do not have access to this private template.');
    }

    const result = await tripCloningService.createTripFromTemplate(template, userId, useData);
    await tripTemplateRepository.incrementCopyCount(template.id);

    return result;
  }

  /**
   * Duplicates an existing trip owned by the user.
   */
  async duplicateTrip(tripId, userId, data) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      throw ApiError.notFound('Trip not found.');
    }

    if (String(trip.userId) !== String(userId)) {
      throw ApiError.forbidden('Only the trip owner can duplicate this trip.');
    }

    return tripCloningService.cloneTrip(tripId, userId, data);
  }

  /**
   * Creates a private personal copy from a public shared trip token.
   */
  async copySharedTrip(shareToken, userId) {
    const sharedRecord = await sharedTripRepository.findByToken(shareToken);
    if (!sharedRecord) {
      throw ApiError.notFound('Shared trip not found or link has expired.');
    }

    const sourceTrip = await tripRepository.findById(sharedRecord.tripId);
    if (!sourceTrip) {
      throw ApiError.notFound('Source trip no longer exists.');
    }

    return tripCloningService.cloneTrip(sourceTrip.id, userId, {
      name: `${sourceTrip.name} (Shared Copy)`,
      visibility: 'PRIVATE'
    });
  }

  /**
   * Favorites a template.
   */
  async favoriteTemplate(templateId, userId) {
    const template = await tripTemplateRepository.findById(templateId);
    if (!template) {
      throw ApiError.notFound('Template not found.');
    }

    if (template.visibility === 'PRIVATE' && String(template.userId) !== String(userId)) {
      throw ApiError.forbidden('You do not have access to this private template.');
    }

    const isFav = await templateFavoriteRepository.isFavorited(template.id, userId);
    if (isFav) {
      throw ApiError.conflict('Template is already in your favorites.');
    }

    const favorite = await templateFavoriteRepository.create(template.id, userId);
    await tripTemplateRepository.incrementFavoriteCount(template.id);

    return favorite;
  }

  /**
   * Unfavorites a template.
   */
  async unfavoriteTemplate(templateId, userId) {
    const existing = await templateFavoriteRepository.findByTemplateAndUser(templateId, userId);
    if (!existing) {
      throw ApiError.notFound('Template favorite not found.');
    }

    await templateFavoriteRepository.delete(templateId, userId);
    await tripTemplateRepository.adjustFavoriteCount(templateId, -1);

    return { message: 'Template removed from favorites.' };
  }

  /**
   * Retrieves user's favorite templates.
   */
  async getMyFavorites(userId, query = {}) {
    const result = await templateFavoriteRepository.findByUserId(userId, query);
    const rawFavs = Array.isArray(result) ? result : (result.favorites || []);
    const populated = await Promise.all(
      rawFavs.map(async (fav) => {
        const tmpl = await tripTemplateRepository.findById(fav.templateId);
        return {
          favoriteId: fav.id,
          favoritedAt: fav.createdAt,
          template: tmpl || null
        };
      })
    );

    return {
      favorites: populated.filter((f) => f.template !== null),
      total: result.total !== undefined ? result.total : populated.length,
      page: result.page || 1,
      limit: result.limit || 20
    };
  }
}

module.exports = new TripTemplateService();
