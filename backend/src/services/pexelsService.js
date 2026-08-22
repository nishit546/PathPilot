const axios = require('axios');
const config = require('../config');

const PEXELS_BASE_URL = 'https://api.pexels.com/v1';

class PexelsService {
  /**
   * Search Pexels for travel and activity photographs
   * @param {string} query Search terms (e.g., "Jaipur India fort", "Goa beach")
   * @returns {Promise<string|null>} Direct image URL from Pexels or null if not found/error
   */
  async searchPhoto(query) {
    if (!query || typeof query !== 'string' || !query.trim()) {
      return null;
    }

    const apiKey = config.pexelsApiKey;
    if (!apiKey) {
      console.warn('Pexels API key is not configured.');
      return null;
    }

    try {
      const response = await axios.get(`${PEXELS_BASE_URL}/search`, {
        params: {
          query: query.trim(),
          per_page: 3,
          orientation: 'landscape'
        },
        headers: {
          Authorization: apiKey
        },
        timeout: 5000
      });

      const photos = response.data.photos || [];
      if (photos.length > 0) {
        // Return large2x image source for high quality
        return photos[0].src.large2x || photos[0].src.large || photos[0].src.medium || null;
      }
      return null;
    } catch (error) {
      if (error.response) {
        console.warn(`Pexels API error (${error.response.status}): ${error.message}`);
      } else {
        console.warn(`Pexels API request failed: ${error.message}`);
      }
      return null;
    }
  }
}

module.exports = new PexelsService();
