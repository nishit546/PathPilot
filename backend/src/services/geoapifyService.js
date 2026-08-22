const axios = require('axios');
const config = require('../config');
const ApiError = require('../utils/ApiError');

const GEOAPIFY_BASE_URL = 'https://api.geoapify.com';

// Simple in-memory cache to prevent duplicate external API calls
const cache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const getCached = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.data;
};

const setCached = (key, data) => {
  if (cache.size > 500) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
};

/**
 * Map Geoapify categories array to PathPilot standard activity categories
 */
const mapCategory = (categories = []) => {
  const catStr = Array.isArray(categories) ? categories.join(',') : String(categories);
  if (catStr.includes('heritage') || catStr.includes('building.historic') || catStr.includes('tourism.attraction')) return 'Culture';
  if (catStr.includes('catering') || catStr.includes('restaurant') || catStr.includes('food')) return 'Food';
  if (catStr.includes('entertainment') || catStr.includes('leisure')) return 'Entertainment';
  if (catStr.includes('natural') || catStr.includes('park') || catStr.includes('national_park')) return 'Adventure';
  if (catStr.includes('commercial') || catStr.includes('shopping')) return 'Shopping';
  return 'Sightseeing';
};

class GeoapifyService {
  /**
   * Search travel destinations by city/place name using Geoapify Geocoding API
   * @param {string} query Search text (e.g. "Jaipur", "Goa")
   * @param {number} limit Maximum results to return
   */
  async searchDestinations(query, limit = 10) {
    if (!query || typeof query !== 'string' || !query.trim()) {
      return [];
    }

    const cleanQuery = query.trim().toLowerCase();
    const cacheKey = `dest:${cleanQuery}:${limit}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return cached;
    }

    const apiKey = config.geoapifyApiKey;
    if (!apiKey) {
      throw ApiError.internal('Geoapify API key is not configured on the server.');
    }

    try {
      const response = await axios.get(`${GEOAPIFY_BASE_URL}/v1/geocode/search`, {
        params: {
          text: cleanQuery,
          type: 'city',
          format: 'json',
          limit,
          apiKey
        },
        timeout: 5000
      });

      const results = (response.data.results || []).map(item => ({
        placeId: item.place_id || `geo-${item.lat}-${item.lon}`,
        name: item.city || item.name || item.county || item.formatted.split(',')[0],
        formatted: item.formatted,
        stateRegion: item.state || item.region || item.county || '',
        country: item.country || '',
        countryCode: item.country_code || '',
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        resultType: item.result_type || 'city'
      }));

      // Filter out duplicate entries
      const uniqueDestinations = [];
      const seenNames = new Set();
      for (const dest of results) {
        const key = `${dest.name.toLowerCase()}-${dest.country.toLowerCase()}`;
        if (!seenNames.has(key)) {
          seenNames.add(key);
          uniqueDestinations.push(dest);
        }
      }

      setCached(cacheKey, uniqueDestinations);
      return uniqueDestinations;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw ApiError.gatewayTimeout('Geoapify API request timed out.');
      }
      if (error.response) {
        const status = error.response.status;
        if (status === 401 || status === 403) {
          throw ApiError.internal('Invalid or unauthorized Geoapify API key.');
        }
        if (status === 429) {
          throw ApiError.tooManyRequests('Geoapify rate limit exceeded. Please try again later.');
        }
      }
      throw ApiError.internal(`Geoapify destination search failed: ${error.message}`);
    }
  }

  /**
   * Search POIs and activities near latitude/longitude or query
   * @param {Object} options { latitude, longitude, query, categories, radiusMeters, limit }
   */
  async searchActivities({ latitude, longitude, query, categories, radiusMeters = 10000, limit = 20 }) {
    const apiKey = config.geoapifyApiKey;
    if (!apiKey) {
      throw ApiError.internal('Geoapify API key is not configured on the server.');
    }

    const cacheKey = `act:${latitude}:${longitude}:${query}:${categories}:${limit}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      let results = [];

      if (latitude && longitude) {
        // Places API around coordinates
        const defaultCats = categories || 'tourism,entertainment,leisure,heritage,catering.restaurant,commercial.shopping';
        const response = await axios.get(`${GEOAPIFY_BASE_URL}/v2/places`, {
          params: {
            categories: defaultCats,
            filter: `circle:${longitude},${latitude},${radiusMeters}`,
            limit,
            apiKey
          },
          timeout: 5000
        });

        results = (response.data.features || []).map(feature => {
          const props = feature.properties || {};
          return {
            placeId: props.place_id || `geo-poi-${props.lat}-${props.lon}`,
            name: props.name || props.formatted.split(',')[0],
            description: props.formatted || '',
            address: props.address_line2 || props.formatted || '',
            category: mapCategory(props.categories),
            latitude: parseFloat(props.lat),
            longitude: parseFloat(props.lon),
            estimatedCost: 0,
            durationMinutes: 120,
            rawCategories: props.categories || []
          };
        });
      } else if (query) {
        // Geocode search for POI by query text
        const response = await axios.get(`${GEOAPIFY_BASE_URL}/v1/geocode/search`, {
          params: {
            text: query,
            format: 'json',
            limit,
            apiKey
          },
          timeout: 5000
        });

        results = (response.data.results || []).map(item => ({
          placeId: item.place_id || `geo-poi-${item.lat}-${item.lon}`,
          name: item.name || item.formatted.split(',')[0],
          description: item.formatted || '',
          address: item.formatted || '',
          category: mapCategory(item.category ? [item.category] : []),
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          estimatedCost: 0,
          durationMinutes: 120
        }));
      }

      setCached(cacheKey, results);
      return results;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw ApiError.gatewayTimeout('Geoapify Places API request timed out.');
      }
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        throw ApiError.internal('Invalid or unauthorized Geoapify API key.');
      }
      throw ApiError.internal(`Geoapify activity search failed: ${error.message}`);
    }
  }
}

module.exports = new GeoapifyService();
