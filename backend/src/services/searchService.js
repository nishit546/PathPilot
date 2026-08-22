const mockDb = require('../repositories/mockDatabase');
const searchRepository = require('../repositories/searchRepository');
const tripRepository = require('../repositories/tripRepository');
const tripCollaboratorRepository = require('../repositories/tripCollaboratorRepository');
const tripSectionRepository = require('../repositories/tripSectionRepository');
const cityRepository = require('../repositories/cityRepository');
const activityRepository = require('../repositories/activityRepository');
const tripTemplateRepository = require('../repositories/tripTemplateRepository');
const communityRepository = require('../repositories/communityRepository');
const geoapifyService = require('./geoapifyService');
const imageService = require('./imageService');
const { getTripStatus } = require('../utils/analyticsCalculator');
const {
  matchesQuery,
  calculateRelevanceScore,
  filterNumericRange,
  filterDateRange
} = require('../utils/searchMatcher');

class SearchService {
  /**
   * Helper to fetch all accessible trips for a user.
   */
  async _getAccessibleTrips(userId) {
    if (!userId) return [];
    const tripRes = await tripRepository.findByUserId(userId, { limit: 10000 });
    const ownedTrips = tripRes && tripRes.trips ? tripRes.trips : [];
    const collaborations = await tripCollaboratorRepository.findByUserId(userId);

    const collabTripIds = collaborations.map((c) => c.tripId);
    const collabTrips = [];
    for (const tId of collabTripIds) {
      if (!ownedTrips.some((t) => t.id === tId)) {
        const tr = await tripRepository.findById(tId);
        if (tr) collabTrips.push(tr);
      }
    }
    return [...ownedTrips, ...collabTrips];
  }

  /**
   * Helper to get all cities list
   */
  async _getAllCities() {
    const res = await cityRepository.findAll({ limit: 10000 });
    return res && res.cities ? res.cities : (Array.isArray(res) ? res : mockDb.cities);
  }

  /**
   * Helper to get all activities list
   */
  async _getAllActivities() {
    const res = await activityRepository.findAll({ limit: 10000 });
    return res && res.activities ? res.activities : (Array.isArray(res) ? res : mockDb.activities);
  }

  /**
   * Helper to get all templates list
   */
  async _getAllTemplates() {
    return Array.isArray(mockDb.tripTemplates) ? mockDb.tripTemplates : [];
  }

  /**
   * 1. Global Multi-Resource Search Engine
   */
  async globalSearch(userId, queryParams = {}) {
    const q = (queryParams.q || '').trim();
    const type = (queryParams.type || 'ALL').toUpperCase();
    const page = Math.max(1, Number(queryParams.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(queryParams.limit) || 20));

    // Record recent search if authenticated and query is meaningful
    if (userId && q.length >= 2) {
      await searchRepository.addRecentSearch(userId, q, type);
    }

    const results = {
      trips: [],
      cities: [],
      activities: [],
      templates: [],
      community: []
    };

    // 1. Trips
    if (type === 'ALL' || type === 'TRIPS') {
      const userTrips = await this._getAccessibleTrips(userId);
      results.trips = userTrips
        .filter((t) => matchesQuery(t.name, q) || matchesQuery(t.description, q))
        .map((t) => ({
          ...t,
          status: getTripStatus(t.startDate, t.endDate),
          relevance: calculateRelevanceScore(t.name, q)
        }))
        .sort((a, b) => b.relevance - a.relevance);
    }

    // 2. Cities
    if (type === 'ALL' || type === 'CITIES') {
      const allCities = await this._getAllCities();
      results.cities = allCities
        .filter(
          (c) =>
            matchesQuery(c.name, q) ||
            matchesQuery(c.country, q) ||
            matchesQuery(c.region, q) ||
            matchesQuery(c.description, q)
        )
        .map((c) => ({
          ...c,
          relevance: calculateRelevanceScore(c.name, q, c.popularity || 0)
        }))
        .sort((a, b) => b.relevance - a.relevance);
    }

    // 3. Activities
    if (type === 'ALL' || type === 'ACTIVITIES') {
      const allActivities = await this._getAllActivities();
      results.activities = allActivities
        .filter(
          (a) =>
            matchesQuery(a.name, q) ||
            matchesQuery(a.category, q) ||
            matchesQuery(a.description, q) ||
            (Array.isArray(a.tags) && a.tags.some((t) => matchesQuery(t, q)))
        )
        .map((a) => ({
          ...a,
          relevance: calculateRelevanceScore(a.name, q, a.popularity || 0)
        }))
        .sort((a, b) => b.relevance - a.relevance);
    }

    // 4. Templates
    if (type === 'ALL' || type === 'TEMPLATES') {
      const allTemplates = await this._getAllTemplates();
      results.templates = allTemplates
        .filter((t) => t.isPublic || (userId && String(t.userId || t.creatorId) === String(userId)))
        .filter(
          (t) =>
            matchesQuery(t.name, q) ||
            matchesQuery(t.category, q) ||
            matchesQuery(t.description, q)
        )
        .map((t) => ({
          ...t,
          relevance: calculateRelevanceScore(t.name, q, t.copyCount || 0)
        }))
        .sort((a, b) => b.relevance - a.relevance);
    }

    // 5. Community Posts
    if (type === 'ALL' || type === 'COMMUNITY') {
      const postRes = await communityRepository.findAll({ limit: 1000 });
      const allPosts = postRes && postRes.posts ? postRes.posts : [];
      results.community = allPosts
        .filter((p) => !p.isFlagged && !p.isHidden)
        .filter(
          (p) =>
            matchesQuery(p.title, q) ||
            matchesQuery(p.content, q) ||
            matchesQuery(p.location, q) ||
            (Array.isArray(p.tags) && p.tags.some((t) => matchesQuery(t, q)))
        )
        .map((p) => ({
          ...p,
          relevance: calculateRelevanceScore(p.title, q, p.likesCount || 0)
        }))
        .sort((a, b) => b.relevance - a.relevance);
    }

    const totalResults =
      results.trips.length +
      results.cities.length +
      results.activities.length +
      results.templates.length +
      results.community.length;

    // Apply pagination if a single resource type is searched
    if (type !== 'ALL') {
      const key = type.toLowerCase();
      const list = results[key] || [];
      const totalItems = list.length;
      const offset = (page - 1) * limit;
      const paginated = list.slice(offset, offset + limit);
      results[key] = paginated;

      return {
        query: q,
        type,
        results,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages: Math.ceil(totalItems / limit) || 1,
          hasNextPage: page * limit < totalItems,
          hasPreviousPage: page > 1
        },
        summary: {
          totalResults,
          trips: results.trips.length,
          cities: results.cities.length,
          activities: results.activities.length,
          templates: results.templates.length,
          community: results.community.length
        }
      };
    }

    return {
      query: q,
      type: 'ALL',
      results: {
        trips: results.trips.slice(0, 10),
        cities: results.cities.slice(0, 10),
        activities: results.activities.slice(0, 10),
        templates: results.templates.slice(0, 10),
        community: results.community.slice(0, 10)
      },
      summary: {
        totalResults,
        trips: results.trips.length,
        cities: results.cities.length,
        activities: results.activities.length,
        templates: results.templates.length,
        community: results.community.length
      }
    };
  }

  /**
   * 2. Advanced User Trip Search
   */
  async searchUserTrips(userId, query = {}) {
    const accessibleTrips = await this._getAccessibleTrips(userId);
    const q = (query.q || '').trim();
    const statusFilter = query.status ? query.status.toUpperCase() : null;

    let filtered = [];

    for (const t of accessibleTrips) {
      const status = getTripStatus(t.startDate, t.endDate);
      if (statusFilter && status !== statusFilter) continue;

      if (q && !matchesQuery(t.name, q) && !matchesQuery(t.description, q)) continue;

      if (!filterDateRange(t.startDate, query.startDate, null)) continue;
      if (!filterDateRange(t.endDate, null, query.endDate)) continue;
      if (!filterNumericRange(t.totalBudget, query.minBudget, query.maxBudget)) continue;

      // City filter
      if (query.city) {
        const sections = await tripSectionRepository.findByTripId(t.id);
        const cityMatches = [];
        for (const s of sections) {
          if (s.cityId) {
            const cMeta = await cityRepository.findById(s.cityId);
            if (cMeta && matchesQuery(cMeta.name, query.city)) {
              cityMatches.push(cMeta);
            }
          }
        }
        if (cityMatches.length === 0) continue;
      }

      filtered.push({
        ...t,
        status,
        relevance: calculateRelevanceScore(t.name, q)
      });
    }

    // Sorting
    const sortBy = (query.sortBy || 'CREATED_AT').toUpperCase();
    const order = (query.order || 'DESC').toUpperCase();

    filtered.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'NAME') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
        return order === 'ASC' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (sortBy === 'START_DATE') {
        valA = new Date(a.startDate).getTime();
        valB = new Date(b.startDate).getTime();
      } else if (sortBy === 'END_DATE') {
        valA = new Date(a.endDate).getTime();
        valB = new Date(b.endDate).getTime();
      } else if (sortBy === 'BUDGET') {
        valA = Number(a.totalBudget || 0);
        valB = Number(b.totalBudget || 0);
      } else {
        valA = new Date(a.createdAt || 0).getTime();
        valB = new Date(b.createdAt || 0).getTime();
      }

      return order === 'ASC' ? valA - valB : valB - valA;
    });

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const totalItems = filtered.length;
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      trips: paginated,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit) || 1,
        hasNextPage: page * limit < totalItems,
        hasPreviousPage: page > 1
      }
    };
  }

  /**
   * 3. Advanced Activity Search
   */
  async searchActivities(query = {}) {
    const q = (query.q || '').trim();
    const allActivities = await this._getAllActivities();

    let filtered = allActivities.filter((a) => {
      if (q && !matchesQuery(a.name, q) && !matchesQuery(a.description, q) && !matchesQuery(a.category, q)) {
        return false;
      }
      if (query.category && a.category && a.category.toUpperCase() !== query.category.toUpperCase()) {
        return false;
      }
      if (!filterNumericRange(a.cost || a.estimatedCost, query.minCost, query.maxCost)) {
        return false;
      }
      if (!filterNumericRange(a.duration, query.minDuration, query.maxDuration)) {
        return false;
      }
      return true;
    }).map((a) => ({
      ...a,
      relevance: calculateRelevanceScore(a.name, q, a.popularity || 0)
    }));

    // Sorting
    const sortBy = (query.sortBy || 'POPULARITY').toUpperCase();
    const order = (query.order || 'DESC').toUpperCase();

    filtered.sort((a, b) => {
      let valA = 0, valB = 0;
      if (sortBy === 'NAME') {
        return order === 'ASC' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      } else if (sortBy === 'COST') {
        valA = Number(a.cost || a.estimatedCost || 0);
        valB = Number(b.cost || b.estimatedCost || 0);
      } else if (sortBy === 'DURATION') {
        valA = Number(a.duration || 0);
        valB = Number(b.duration || 0);
      } else {
        valA = Number(a.popularity || 0);
        valB = Number(b.popularity || 0);
      }
      return order === 'ASC' ? valA - valB : valB - valA;
    });

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const totalItems = filtered.length;
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      activities: paginated,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit) || 1,
        hasNextPage: page * limit < totalItems,
        hasPreviousPage: page > 1
      }
    };
  }

  /**
   * 4. Advanced City Search
   */
  async searchCities(query = {}) {
    const q = (query.q || '').trim();
    const allCities = await this._getAllCities();

    let filtered = allCities.filter((c) => {
      if (q && !matchesQuery(c.name, q) && !matchesQuery(c.country, q) && !matchesQuery(c.region, q)) {
        return false;
      }
      if (query.country && !matchesQuery(c.country, query.country)) return false;
      if (query.region && !matchesQuery(c.region, query.region)) return false;
      if (!filterNumericRange(c.costIndex, query.minCostIndex, query.maxCostIndex)) return false;
      return true;
    }).map((c) => ({
      ...c,
      relevance: calculateRelevanceScore(c.name, q, c.popularity || 0)
    }));

    if (q.length >= 2) {
      try {
        const geoResults = await geoapifyService.searchDestinations(q);
        const existingNames = new Set(filtered.map(c => `${c.name.toLowerCase()}-${c.country.toLowerCase()}`));
        for (const geo of geoResults) {
          const key = `${geo.name.toLowerCase()}-${geo.country.toLowerCase()}`;
          if (!existingNames.has(key)) {
            existingNames.add(key);
            const imageUrl = await imageService.getDestinationImage(geo.name, geo.country);
            filtered.push({
              id: geo.placeId,
              name: geo.name,
              country: geo.country,
              region: geo.stateRegion || 'Global',
              description: geo.formatted,
              imageUrl,
              popularity: 75,
              costIndex: 30,
              latitude: geo.latitude,
              longitude: geo.longitude,
              source: 'geoapify',
              relevance: calculateRelevanceScore(geo.name, q, 75)
            });
          }
        }
      } catch (err) {
        console.error('Geoapify searchCities fallback warning:', err.message);
      }
    }

    // Sorting
    const sortBy = (query.sortBy || 'POPULARITY').toUpperCase();
    const order = (query.order || 'DESC').toUpperCase();

    filtered.sort((a, b) => {
      let valA = 0, valB = 0;
      if (sortBy === 'NAME') {
        return order === 'ASC' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      } else if (sortBy === 'COST_INDEX') {
        valA = Number(c.costIndex || 0);
        valB = Number(c.costIndex || 0);
      } else {
        valA = Number(a.popularity || 0);
        valB = Number(b.popularity || 0);
      }
      return order === 'ASC' ? valA - valB : valB - valA;
    });

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const totalItems = filtered.length;
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      cities: paginated,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit) || 1,
        hasNextPage: page * limit < totalItems,
        hasPreviousPage: page > 1
      }
    };
  }

  /**
   * 5. Template Search
   */
  async searchTemplates(userId, query = {}) {
    const q = (query.q || '').trim();
    const allTemplates = await this._getAllTemplates();

    let filtered = allTemplates.filter((t) => {
      if (!t.isPublic && (!userId || String(t.userId || t.creatorId) !== String(userId))) return false;

      if (q && !matchesQuery(t.name, q) && !matchesQuery(t.category, q) && !matchesQuery(t.description, q)) {
        return false;
      }
      if (query.category && t.category && t.category.toUpperCase() !== query.category.toUpperCase()) {
        return false;
      }
      if (!filterNumericRange(t.metadata?.totalDays, query.minDuration, query.maxDuration)) return false;
      if (!filterNumericRange(t.metadata?.estimatedCost, query.minCost, query.maxCost)) return false;
      return true;
    }).map((t) => ({
      ...t,
      relevance: calculateRelevanceScore(t.name, q, t.copyCount || 0)
    }));

    // Sorting
    const sortBy = (query.sortBy || 'POPULARITY').toUpperCase();
    const order = (query.order || 'DESC').toUpperCase();

    filtered.sort((a, b) => {
      let valA = 0, valB = 0;
      if (sortBy === 'NEWEST') {
        valA = new Date(a.createdAt || 0).getTime();
        valB = new Date(b.createdAt || 0).getTime();
      } else if (sortBy === 'COST') {
        valA = Number(a.metadata?.estimatedCost || 0);
        valB = Number(b.metadata?.estimatedCost || 0);
      } else if (sortBy === 'DURATION') {
        valA = Number(a.metadata?.totalDays || 0);
        valB = Number(b.metadata?.totalDays || 0);
      } else if (sortBy === 'FAVORITES') {
        valA = Number(a.favoriteCount || 0);
        valB = Number(b.favoriteCount || 0);
      } else {
        valA = Number(a.copyCount || 0);
        valB = Number(b.copyCount || 0);
      }
      return order === 'ASC' ? valA - valB : valB - valA;
    });

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const totalItems = filtered.length;
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      templates: paginated,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit) || 1,
        hasNextPage: page * limit < totalItems,
        hasPreviousPage: page > 1
      }
    };
  }

  /**
   * 6. Community Search
   */
  async searchCommunity(query = {}) {
    const q = (query.q || '').trim();
    const postRes = await communityRepository.findAll({ limit: 1000 });
    const allPosts = postRes && postRes.posts ? postRes.posts : [];

    let filtered = allPosts.filter((p) => {
      if (p.isFlagged || p.isHidden) return false;
      if (q && !matchesQuery(p.title, q) && !matchesQuery(p.content, q) && !matchesQuery(p.location, q)) {
        return false;
      }
      if (query.category && p.category && p.category.toUpperCase() !== query.category.toUpperCase()) {
        return false;
      }
      if (query.city && !matchesQuery(p.location, query.city)) return false;
      return true;
    }).map((p) => ({
      ...p,
      relevance: calculateRelevanceScore(p.title, q, p.likesCount || 0)
    }));

    // Sorting
    const sortBy = (query.sortBy || 'NEWEST').toUpperCase();
    const order = (query.order || 'DESC').toUpperCase();

    filtered.sort((a, b) => {
      let valA = 0, valB = 0;
      if (sortBy === 'LIKES') {
        valA = Number(a.likesCount || 0);
        valB = Number(b.likesCount || 0);
      } else if (sortBy === 'COMMENTS') {
        valA = Number(a.commentsCount || 0);
        valB = Number(b.commentsCount || 0);
      } else if (sortBy === 'POPULARITY') {
        valA = Number(a.likesCount || 0) + Number(a.commentsCount || 0);
        valB = Number(b.likesCount || 0) + Number(b.commentsCount || 0);
      } else {
        valA = new Date(a.createdAt || 0).getTime();
        valB = new Date(b.createdAt || 0).getTime();
      }
      return order === 'ASC' ? valA - valB : valB - valA;
    });

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const totalItems = filtered.length;
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      posts: paginated,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit) || 1,
        hasNextPage: page * limit < totalItems,
        hasPreviousPage: page > 1
      }
    };
  }

  /**
   * 7. Instant Search Suggestions
   */
  async getSearchSuggestions(userId, q) {
    if (!q || q.trim().length < 2) {
      return { suggestions: [] };
    }
    const cleanQuery = q.trim();
    const suggestions = [];

    // Cities
    const allCities = await this._getAllCities();
    allCities.forEach((c) => {
      const score = calculateRelevanceScore(c.name, cleanQuery, c.popularity || 0);
      if (score > 0) {
        suggestions.push({
          type: 'CITY',
          label: `${c.name}, ${c.country}`,
          value: c.name,
          id: c.id,
          relevance: score
        });
      }
    });

    // Activities
    const allActivities = await this._getAllActivities();
    allActivities.forEach((a) => {
      const score = calculateRelevanceScore(a.name, cleanQuery, a.popularity || 0);
      if (score > 0) {
        suggestions.push({
          type: 'ACTIVITY',
          label: a.name,
          value: a.name,
          id: a.id,
          relevance: score
        });
      }
    });

    // User Accessible Trips
    if (userId) {
      const userTrips = await this._getAccessibleTrips(userId);
      userTrips.forEach((t) => {
        const score = calculateRelevanceScore(t.name, cleanQuery);
        if (score > 0) {
          suggestions.push({
            type: 'TRIP',
            label: t.name,
            value: t.name,
            id: t.id,
            relevance: score
          });
        }
      });
    }

    // Public Templates
    const templates = await this._getAllTemplates();
    templates.filter((t) => t.isPublic).forEach((t) => {
      const score = calculateRelevanceScore(t.name, cleanQuery, t.copyCount || 0);
      if (score > 0) {
        suggestions.push({
          type: 'TEMPLATE',
          label: t.name,
          value: t.name,
          id: t.id,
          relevance: score
        });
      }
    });

    // Sort by relevance descending, limit to 10 suggestions
    suggestions.sort((a, b) => b.relevance - a.relevance);
    const topSuggestions = suggestions.slice(0, 10).map(({ type, label, value, id }) => ({
      type,
      label,
      value,
      id
    }));

    return {
      query: cleanQuery,
      totalSuggestions: topSuggestions.length,
      suggestions: topSuggestions
    };
  }

  /**
   * 8. Recent Searches Management
   */
  async getRecentSearches(userId) {
    const list = await searchRepository.getRecentSearches(userId);
    return { recentSearches: list };
  }

  async clearRecentSearches(userId) {
    await searchRepository.clearRecentSearches(userId);
    return { message: 'Recent search history cleared successfully.' };
  }

  async deleteRecentSearch(userId, searchId) {
    const deleted = await searchRepository.deleteRecentSearch(userId, searchId);
    return { message: deleted ? 'Search entry deleted.' : 'Search entry not found.' };
  }

  /**
   * 9. Popular Searches Engine
   */
  async getPopularSearches() {
    const cities = await this._getAllCities();
    const activities = await this._getAllActivities();
    const templates = await this._getAllTemplates();

    const popular = [];

    // Top cities by popularity
    [...cities]
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 4)
      .forEach((c) => {
        popular.push({
          query: c.name,
          type: 'CITY',
          score: c.popularity || 85
        });
      });

    // Top activities
    [...activities]
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 3)
      .forEach((a) => {
        popular.push({
          query: a.name,
          type: 'ACTIVITY',
          score: a.popularity || 80
        });
      });

    // Top templates
    [...templates]
      .filter((t) => t.isPublic)
      .sort((a, b) => (b.copyCount || 0) - (a.copyCount || 0))
      .slice(0, 3)
      .forEach((t) => {
        popular.push({
          query: t.name,
          type: 'TEMPLATE',
          score: (t.copyCount || 0) * 10 + 75
        });
      });

    popular.sort((a, b) => b.score - a.score);

    return popular;
  }
}

module.exports = new SearchService();
