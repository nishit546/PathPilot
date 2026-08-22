const pexelsService = require('./pexelsService');
const cloudinaryService = require('./cloudinaryService');

const DEFAULT_DESTINATION_IMAGE = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
const DEFAULT_ACTIVITY_IMAGE = 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80';

// In-memory cache for Cloudinary image URLs to prevent duplicate uploads & Pexels requests
const imageCache = new Map();

class ImageService {
  /**
   * Get cached or dynamically fetched Cloudinary image for a destination
   * @param {string} destinationName e.g. "Jaipur"
   * @param {string} countryName e.g. "India"
   * @param {string} defaultFallback Optional fallback image URL
   * @returns {Promise<string>} Cloudinary CDN URL or clean fallback image URL
   */
  async getDestinationImage(destinationName, countryName = '', defaultFallback = DEFAULT_DESTINATION_IMAGE) {
    if (!destinationName || typeof destinationName !== 'string') {
      return defaultFallback;
    }

    const cleanName = destinationName.trim();
    const cleanCountry = countryName.trim();
    const cacheKey = `dest_img:${cleanName.toLowerCase()}_${cleanCountry.toLowerCase()}`;

    // 1. Check in-memory cache
    if (imageCache.has(cacheKey)) {
      return imageCache.get(cacheKey);
    }

    const searchQuery = `${cleanName} ${cleanCountry} travel tourism`.trim();
    const publicId = `dest_${cleanName}_${cleanCountry}`.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

    try {
      // 2. Search Pexels for a photograph
      const pexelsUrl = await pexelsService.searchPhoto(searchQuery);

      if (pexelsUrl) {
        // 3. Upload to Cloudinary for CDN delivery & permanent caching
        const cloudinaryUrl = await cloudinaryService.uploadFromUrl(pexelsUrl, 'pathpilot/destinations', publicId);
        if (cloudinaryUrl) {
          imageCache.set(cacheKey, cloudinaryUrl);
          return cloudinaryUrl;
        }
        // If Cloudinary fails, return direct Pexels URL as temporary fallback
        imageCache.set(cacheKey, pexelsUrl);
        return pexelsUrl;
      }
    } catch (err) {
      console.warn(`ImageService fetch error for ${searchQuery}:`, err.message);
    }

    // 4. Fallback to default static image if external services fail or yield no results
    const fallback = defaultFallback || DEFAULT_DESTINATION_IMAGE;
    imageCache.set(cacheKey, fallback);
    return fallback;
  }

  /**
   * Get cached or dynamically fetched Cloudinary image for an activity/POI
   * @param {string} activityName e.g. "Amber Palace"
   * @param {string} cityName e.g. "Jaipur"
   * @param {string} category e.g. "Culture"
   * @returns {Promise<string>} Cloudinary CDN URL or clean fallback image URL
   */
  async getActivityImage(activityName, cityName = '', category = '', defaultFallback = DEFAULT_ACTIVITY_IMAGE) {
    if (!activityName || typeof activityName !== 'string') {
      return defaultFallback;
    }

    const cleanAct = activityName.trim();
    const cleanCity = cityName.trim();
    const cacheKey = `act_img:${cleanAct.toLowerCase()}_${cleanCity.toLowerCase()}`;

    if (imageCache.has(cacheKey)) {
      return imageCache.get(cacheKey);
    }

    const searchQuery = `${cleanAct} ${cleanCity} ${category}`.trim();
    const publicId = `act_${cleanAct}_${cleanCity}`.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

    try {
      const pexelsUrl = await pexelsService.searchPhoto(searchQuery);
      if (pexelsUrl) {
        const cloudinaryUrl = await cloudinaryService.uploadFromUrl(pexelsUrl, 'pathpilot/activities', publicId);
        if (cloudinaryUrl) {
          imageCache.set(cacheKey, cloudinaryUrl);
          return cloudinaryUrl;
        }
        imageCache.set(cacheKey, pexelsUrl);
        return pexelsUrl;
      }
    } catch (err) {
      console.warn(`ImageService activity fetch error for ${searchQuery}:`, err.message);
    }

    const fallback = defaultFallback || DEFAULT_ACTIVITY_IMAGE;
    imageCache.set(cacheKey, fallback);
    return fallback;
  }
}

module.exports = new ImageService();
