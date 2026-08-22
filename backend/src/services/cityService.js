const cityRepository = require('../repositories/cityRepository');
const activityRepository = require('../repositories/activityRepository');
const geoapifyService = require('./geoapifyService');
const imageService = require('./imageService');
const ApiError = require('../utils/ApiError');

class CityService {
  async getAllCities(filters = {}) {
    const localResult = await cityRepository.findAll(filters);
    
    // If search query is provided, enrich with Geoapify destinations & Pexels/Cloudinary images
    const searchQuery = (filters.search || filters.q || '').trim();
    if (searchQuery.length >= 2) {
      try {
        const geoResults = await geoapifyService.searchDestinations(searchQuery);
        const geoCities = await Promise.all(geoResults.map(async g => {
          const imageUrl = await imageService.getDestinationImage(g.name, g.country);
          return {
            id: g.placeId,
            name: g.name,
            country: g.country,
            region: g.stateRegion || 'Global',
            description: g.formatted,
            imageUrl,
            popularity: 80,
            costIndex: 30,
            latitude: g.latitude,
            longitude: g.longitude,
            source: 'geoapify'
          };
        }));

        // Combine local results and Geoapify results without duplicates
        const existingNames = new Set(localResult.cities.map(c => `${c.name.toLowerCase()}-${c.country.toLowerCase()}`));
        const newGeo = geoCities.filter(g => !existingNames.has(`${g.name.toLowerCase()}-${g.country.toLowerCase()}`));
        
        const combined = [...localResult.cities, ...newGeo];
        return {
          cities: combined,
          total: combined.length,
          page: localResult.page || 1,
          limit: localResult.limit || combined.length
        };
      } catch (err) {
        // Fallback gracefully to local results if Geoapify or Image fetching encounters an issue
        console.error('Geoapify destination fetch warning:', err.message);
      }
    }

    return localResult;
  }

  async getCityById(id) {
    const city = await cityRepository.findById(id);
    if (!city) {
      // Check if ID is a Geoapify placeId
      if (String(id).startsWith('geo-') || String(id).length > 20) {
        return {
          id,
          name: 'Discovered Destination',
          country: 'Global',
          region: 'Explore',
          description: 'Destination retrieved from Geoapify',
          imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
          activities: []
        };
      }
      throw ApiError.notFound('City not found.');
    }

    const activities = await activityRepository.findByCityId(city.id);
    return {
      ...city,
      activities
    };
  }
}

module.exports = new CityService();
