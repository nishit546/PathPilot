const packingRepository = require('../repositories/packingRepository');
const travelDocumentRepository = require('../repositories/travelDocumentRepository');
const preparationTaskRepository = require('../repositories/preparationTaskRepository');
const tripRepository = require('../repositories/tripRepository');
const tripSectionRepository = require('../repositories/tripSectionRepository');
const dayRepository = require('../repositories/dayRepository');
const dayActivityRepository = require('../repositories/dayActivityRepository');
const activityRepository = require('../repositories/activityRepository');
const tripAccessService = require('./tripAccessService');
const notificationService = require('./notificationService');
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

class TripPreparationService {
  /**
   * Retrieves packing list with summary progress and categorized items.
   */
  async getPackingList(tripId, userId, filters = {}) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);
    const items = await packingRepository.findByTripId(trip.id, filters);

    const totalItems = items.length;
    const packedItems = items.filter((i) => i.isPacked).length;
    const remainingItems = totalItems - packedItems;
    const essentialItems = items.filter((i) => i.isEssential);
    const essentialPacked = essentialItems.filter((i) => i.isPacked).length;

    const progress = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 100;

    const categoryNames = [
      'CLOTHING',
      'TOILETRIES',
      'ELECTRONICS',
      'DOCUMENTS',
      'MEDICINE',
      'ACCESSORIES',
      'ACTIVITY_GEAR',
      'OTHER'
    ];

    const categories = categoryNames.map((name) => ({
      name,
      items: items.filter((i) => i.category === name)
    })).filter((cat) => filters.category ? cat.name === filters.category.toUpperCase() : true);

    return {
      tripId: trip.id,
      summary: {
        totalItems,
        packedItems,
        remainingItems,
        essentialTotal: essentialItems.length,
        essentialPacked,
        progress
      },
      categories,
      items
    };
  }

  /**
   * Adds a new packing item.
   */
  async addPackingItem(tripId, userId, data) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR']);

    const existing = await packingRepository.findByNameAndTrip(trip.id, data.name);
    if (existing) {
      throw ApiError.conflict('An item with this name already exists in your packing list.');
    }

    const created = await packingRepository.createItem({
      ...data,
      tripId: trip.id,
      createdBy: userId
    });

    return created;
  }

  /**
   * Updates an existing packing item.
   */
  async updatePackingItem(tripId, itemId, userId, data) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR']);
    const item = await packingRepository.findItemById(itemId);
    if (!item || String(item.tripId) !== String(trip.id)) {
      throw ApiError.notFound('Packing item not found on this trip.');
    }

    if (data.name && data.name.toLowerCase() !== item.name.toLowerCase()) {
      const duplicate = await packingRepository.findByNameAndTrip(trip.id, data.name);
      if (duplicate && String(duplicate.id) !== String(item.id)) {
        throw ApiError.conflict('Another item with this name already exists in your packing list.');
      }
    }

    const updated = await packingRepository.updateItem(item.id, data);
    return updated;
  }

  /**
   * Deletes a packing item.
   */
  async deletePackingItem(tripId, itemId, userId) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR']);
    const item = await packingRepository.findItemById(itemId);
    if (!item || String(item.tripId) !== String(trip.id)) {
      throw ApiError.notFound('Packing item not found on this trip.');
    }

    await packingRepository.deleteItem(item.id);
    return { message: 'Packing item deleted successfully.' };
  }

  /**
   * Bulk updates packed status for multiple items.
   */
  async bulkUpdatePackingStatus(tripId, userId, itemsPayload) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR']);

    const updated = await packingRepository.bulkUpdatePackedStatus(trip.id, itemsPayload);
    const allItems = await packingRepository.findByTripId(trip.id);

    const totalItems = allItems.length;
    const packedItems = allItems.filter((i) => i.isPacked).length;
    const progress = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 100;

    return {
      tripId: trip.id,
      updatedCount: updated.length,
      progress,
      summary: {
        totalItems,
        packedItems,
        remainingItems: totalItems - packedItems,
        progress
      }
    };
  }

  /**
   * Generates deterministic smart packing suggestions based on trip metadata and activities.
   */
  async getPackingSuggestions(tripId, userId) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);
    const existingItems = await packingRepository.findByTripId(trip.id);
    const existingNames = new Set(existingItems.map((i) => i.name.toLowerCase()));

    const dateRange = getDateRange(trip.startDate, trip.endDate);
    const durationDays = dateRange.length;

    const sections = await tripSectionRepository.findByTripId(trip.id);
    const scheduledActivities = [];

    for (const sec of sections) {
      const days = await dayRepository.findBySectionId(sec.id);
      for (const d of days) {
        const dActs = await dayActivityRepository.findByDayId(d.id);
        for (const da of dActs) {
          const actMeta = await activityRepository.findById(da.activityId);
          if (actMeta) scheduledActivities.push(actMeta);
        }
      }
    }

    const activityCategories = new Set(scheduledActivities.map((a) => a.category?.toUpperCase()).filter(Boolean));
    const activityNames = scheduledActivities.map((a) => a.name.toLowerCase()).join(' ');

    const suggestionsCatalog = [];

    // Duration based rules
    if (durationDays > 5) {
      suggestionsCatalog.push({
        id: 'sugg-duration-clothes',
        name: 'Extra Outfits & Undergarments',
        category: 'CLOTHING',
        quantity: durationDays,
        isEssential: true,
        reason: `Your trip spans ${durationDays} days; extra clothing rotation is recommended`,
        priority: 'HIGH'
      });
      suggestionsCatalog.push({
        id: 'sugg-laundry-kit',
        name: 'Laundry Bag & Detergent Pods',
        category: 'TOILETRIES',
        quantity: 1,
        isEssential: false,
        reason: 'Extended trip duration benefits from on-the-go laundry access',
        priority: 'MEDIUM'
      });
    }

    // Power & electronics
    suggestionsCatalog.push({
      id: 'sugg-power-bank',
      name: 'Portable Power Bank (10,000mAh+)',
      category: 'ELECTRONICS',
      quantity: 1,
      isEssential: true,
      reason: 'Keep your smartphone charged for maps, tickets, and camera use throughout the day',
      priority: 'HIGH'
    });
    suggestionsCatalog.push({
      id: 'sugg-travel-adapter',
      name: 'Universal Travel Power Adapter',
      category: 'ELECTRONICS',
      quantity: 1,
      isEssential: true,
      reason: 'Essential for international destination plug standards',
      priority: 'HIGH'
    });

    // Adventure / Outdoor activities
    const isAdventure = activityCategories.has('ADVENTURE') || activityCategories.has('NATURE') || /hike|trek|climb|mountain|outdoor|safari/i.test(activityNames);
    if (isAdventure) {
      suggestionsCatalog.push({
        id: 'sugg-hiking-shoes',
        name: 'Sturdy Hiking Boots or Trail Shoes',
        category: 'ACTIVITY_GEAR',
        quantity: 1,
        isEssential: true,
        reason: 'Your itinerary includes adventure and nature activities',
        priority: 'HIGH'
      });
      suggestionsCatalog.push({
        id: 'sugg-water-bottle',
        name: 'Insulated Water Bottle',
        category: 'ACCESSORIES',
        quantity: 1,
        isEssential: true,
        reason: 'Stay hydrated during outdoor hikes and excursions',
        priority: 'HIGH'
      });
      suggestionsCatalog.push({
        id: 'sugg-first-aid',
        name: 'Compact First Aid & Blister Kit',
        category: 'MEDICINE',
        quantity: 1,
        isEssential: true,
        reason: 'Safety gear for trail walks and active travel',
        priority: 'HIGH'
      });
    }

    // Water / Beach activities
    const isWater = activityCategories.has('WATER') || /swim|beach|boat|cruise|kayak|snorkel|surf|lake/i.test(activityNames);
    if (isWater) {
      suggestionsCatalog.push({
        id: 'sugg-swimwear',
        name: 'Quick-Dry Swimwear',
        category: 'CLOTHING',
        quantity: 2,
        isEssential: true,
        reason: 'Itinerary includes beach, water, or cruise activities',
        priority: 'HIGH'
      });
      suggestionsCatalog.push({
        id: 'sugg-waterproof-pouch',
        name: 'Waterproof Phone Case / Dry Bag',
        category: 'ACCESSORIES',
        quantity: 1,
        isEssential: false,
        reason: 'Protects electronics around water bodies and boat tours',
        priority: 'MEDIUM'
      });
      suggestionsCatalog.push({
        id: 'sugg-sunscreen',
        name: 'Broad-Spectrum Sunscreen (SPF 50+)',
        category: 'TOILETRIES',
        quantity: 1,
        isEssential: true,
        reason: 'UV skin protection for outdoor water activities',
        priority: 'HIGH'
      });
    }

    // Photography / Sightseeing
    const isSightseeing = activityCategories.has('CULTURE') || activityCategories.has('ENTERTAINMENT') || /museum|tower|shrine|temple|sightseeing|photo|city/i.test(activityNames);
    if (isSightseeing) {
      suggestionsCatalog.push({
        id: 'sugg-walking-shoes',
        name: 'Cushioned Walking Sneakers',
        category: 'CLOTHING',
        quantity: 1,
        isEssential: true,
        reason: 'Comfortable footwear for comprehensive historical and city walking tours',
        priority: 'HIGH'
      });
      suggestionsCatalog.push({
        id: 'sugg-day-backpack',
        name: 'Lightweight Packable Daypack',
        category: 'ACCESSORIES',
        quantity: 1,
        isEssential: false,
        reason: 'Carry daytime essentials, jackets, and souvenirs comfortably',
        priority: 'MEDIUM'
      });
    }

    // Food exploration
    const isFoodie = activityCategories.has('FOOD') || /dinner|food|market|street food|culinary|tasting/i.test(activityNames);
    if (isFoodie) {
      suggestionsCatalog.push({
        id: 'sugg-digestive-aid',
        name: 'Digestive Enzymes & Antacids',
        category: 'MEDICINE',
        quantity: 1,
        isEssential: false,
        reason: 'Support comfort while exploring diverse local street food cuisines',
        priority: 'MEDIUM'
      });
      suggestionsCatalog.push({
        id: 'sugg-hand-sanitizer',
        name: 'Hand Sanitizer & Disinfectant Wipes',
        category: 'TOILETRIES',
        quantity: 2,
        isEssential: true,
        reason: 'Hygiene before tasting food at busy street markets and pop-ups',
        priority: 'HIGH'
      });
    }

    // Filter out items already packed or added
    const filteredSuggestions = suggestionsCatalog.filter(
      (sugg) => !existingNames.has(sugg.name.toLowerCase())
    );

    return {
      tripId: trip.id,
      totalSuggestions: filteredSuggestions.length,
      suggestions: filteredSuggestions
    };
  }

  /**
   * Converts a smart packing suggestion into an active packing item.
   */
  async addSuggestionToPackingList(tripId, suggestionId, userId, customOverrides = {}) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR']);
    const { suggestions } = await this.getPackingSuggestions(trip.id, userId);

    const suggestion = suggestions.find((s) => s.id === suggestionId || s.name.toLowerCase() === suggestionId.toLowerCase());
    if (!suggestion) {
      throw ApiError.notFound('Suggestion not found or already added to packing list.');
    }

    const existing = await packingRepository.findByNameAndTrip(trip.id, suggestion.name);
    if (existing) {
      throw ApiError.conflict('This suggested item is already in your packing list.');
    }

    const created = await packingRepository.createItem({
      tripId: trip.id,
      name: customOverrides.name || suggestion.name,
      category: customOverrides.category || suggestion.category,
      quantity: customOverrides.quantity || suggestion.quantity || 1,
      isEssential: customOverrides.isEssential !== undefined ? customOverrides.isEssential : suggestion.isEssential,
      isPacked: false,
      createdBy: userId
    });

    return created;
  }

  // ==========================================
  // TRAVEL DOCUMENTS
  // ==========================================

  async getTravelDocuments(tripId, userId) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);
    const documents = await travelDocumentRepository.findByTripId(trip.id);

    const totalRequired = documents.filter((d) => d.isRequired).length;
    const readyRequired = documents.filter((d) => d.isRequired && (d.isReady || d.isVerified)).length;
    const progress = totalRequired > 0 ? Math.round((readyRequired / totalRequired) * 100) : 100;

    return {
      tripId: trip.id,
      summary: {
        totalDocuments: documents.length,
        totalRequired,
        readyRequired,
        pendingRequired: totalRequired - readyRequired,
        progress
      },
      documents
    };
  }

  async createTravelDocument(tripId, userId, data) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR']);
    const created = await travelDocumentRepository.create({
      ...data,
      tripId: trip.id,
      userId
    });
    return created;
  }

  async updateTravelDocument(tripId, documentId, userId, data) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR']);
    const doc = await travelDocumentRepository.findById(documentId);
    if (!doc || String(doc.tripId) !== String(trip.id)) {
      throw ApiError.notFound('Travel document not found on this trip.');
    }
    const updated = await travelDocumentRepository.update(doc.id, data);
    return updated;
  }

  async deleteTravelDocument(tripId, documentId, userId) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR']);
    const doc = await travelDocumentRepository.findById(documentId);
    if (!doc || String(doc.tripId) !== String(trip.id)) {
      throw ApiError.notFound('Travel document not found on this trip.');
    }
    await travelDocumentRepository.delete(doc.id);
    return { message: 'Travel document deleted successfully.' };
  }

  // ==========================================
  // PREPARATION TASKS
  // ==========================================

  async getPreparationTasks(tripId, userId) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);
    const tasks = await preparationTaskRepository.findByTripId(trip.id);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.isCompleted || t.status === 'COMPLETED').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    return {
      tripId: trip.id,
      summary: {
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        progress
      },
      tasks
    };
  }

  async createPreparationTask(tripId, userId, data) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR']);
    const created = await preparationTaskRepository.create({
      ...data,
      tripId: trip.id,
      userId
    });
    return created;
  }

  async updatePreparationTask(tripId, taskId, userId, data) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR']);
    const task = await preparationTaskRepository.findById(taskId);
    if (!task || String(task.tripId) !== String(trip.id)) {
      throw ApiError.notFound('Preparation task not found on this trip.');
    }
    const updated = await preparationTaskRepository.update(task.id, data);
    return updated;
  }

  async deletePreparationTask(tripId, taskId, userId) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR']);
    const task = await preparationTaskRepository.findById(taskId);
    if (!task || String(task.tripId) !== String(trip.id)) {
      throw ApiError.notFound('Preparation task not found on this trip.');
    }
    await preparationTaskRepository.delete(task.id);
    return { message: 'Preparation task deleted successfully.' };
  }

  // ==========================================
  // TRIP READINESS SCORING & ALERTS
  // ==========================================

  async getTripReadiness(tripId, userId, triggerAlerts = true) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);

    // 1. Packing component (40% weight)
    const packingItems = await packingRepository.findByTripId(trip.id);
    const packingTotal = packingItems.length;
    const packingPacked = packingItems.filter((i) => i.isPacked).length;
    const packingScore = packingTotal > 0 ? Math.round((packingPacked / packingTotal) * 100) : 100;

    // 2. Documents component (30% weight)
    const documents = await travelDocumentRepository.findByTripId(trip.id);
    const requiredDocs = documents.filter((d) => d.isRequired);
    const readyRequiredDocs = requiredDocs.filter((d) => d.isReady || d.isVerified);
    const documentScore = requiredDocs.length > 0 ? Math.round((readyRequiredDocs.length / requiredDocs.length) * 100) : 100;

    // 3. Preparation tasks (20% weight)
    const tasks = await preparationTaskRepository.findByTripId(trip.id);
    const taskTotal = tasks.length;
    const taskCompleted = tasks.filter((t) => t.isCompleted || t.status === 'COMPLETED').length;
    const taskScore = taskTotal > 0 ? Math.round((taskCompleted / taskTotal) * 100) : 100;

    // 4. Itinerary completion (10% weight)
    const tripSections = await tripSectionRepository.findByTripId(trip.id);
    let totalScheduledDays = 0;
    let daysWithActivities = 0;

    for (const sec of tripSections) {
      const days = await dayRepository.findBySectionId(sec.id);
      totalScheduledDays += days.length;
      for (const d of days) {
        const acts = await dayActivityRepository.findByDayId(d.id);
        if (acts.length > 0) daysWithActivities++;
      }
    }
    const itineraryScore = totalScheduledDays > 0 ? Math.round((daysWithActivities / totalScheduledDays) * 100) : 100;

    // Overall Readiness Score: (40% Packing + 30% Docs + 20% Tasks + 10% Itinerary)
    const totalScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          0.4 * packingScore +
          0.3 * documentScore +
          0.2 * taskScore +
          0.1 * itineraryScore
        )
      )
    );

    let status = 'NOT_READY';
    if (totalScore >= 90) {
      status = 'READY';
    } else if (totalScore >= 75) {
      status = 'ALMOST_READY';
    } else if (totalScore >= 50) {
      status = 'NEEDS_PREPARATION';
    }

    // Collect actionable missing items
    const missingItems = [];

    // Missing required documents
    requiredDocs.filter((d) => !d.isReady).forEach((d) => {
      missingItems.push(`${d.name} (Required Document Pending)`);
    });

    // Unpacked essential items
    packingItems.filter((i) => i.isEssential && !i.isPacked).forEach((i) => {
      missingItems.push(`${i.name} (Essential Packing Item)`);
    });

    // Critical pending tasks
    tasks.filter((t) => !t.isCompleted && (t.priority === 'CRITICAL' || t.priority === 'HIGH')).forEach((t) => {
      missingItems.push(`${t.title} (${t.priority} Priority Task)`);
    });

    // Trigger smart readiness notifications with duplicate prevention
    if (triggerAlerts && missingItems.length > 0 && totalScore < 75) {
      const today = new Date().toISOString().split('T')[0];
      const daysUntilTrip = Math.ceil((new Date(trip.startDate) - new Date(today)) / (1000 * 60 * 60 * 24));

      if (daysUntilTrip <= 14 && daysUntilTrip >= 0) {
        await notificationService.createNotification({
          userId: trip.userId,
          type: 'SYSTEM',
          title: 'Trip Preparation Reminder',
          message: `Your trip "${trip.name}" is coming up in ${daysUntilTrip} days. You still have ${missingItems.length} critical preparation items pending.`,
          relatedTripId: trip.id,
          preventDuplicate: true
        });
      }
    }

    return {
      tripId: trip.id,
      score: totalScore,
      status,
      breakdown: {
        packing: packingScore,
        documents: documentScore,
        tasks: taskScore,
        itinerary: itineraryScore
      },
      summary: {
        packingItemsTotal: packingTotal,
        packingItemsPacked: packingPacked,
        requiredDocsTotal: requiredDocs.length,
        requiredDocsReady: readyRequiredDocs.length,
        tasksTotal: taskTotal,
        tasksCompleted: taskCompleted
      },
      missingItems
    };
  }
}

module.exports = new TripPreparationService();
