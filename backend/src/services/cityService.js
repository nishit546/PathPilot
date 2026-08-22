const cityRepository = require('../repositories/cityRepository');
const activityRepository = require('../repositories/activityRepository');
const ApiError = require('../utils/ApiError');

class CityService {
  async getAllCities(filters) {
    return cityRepository.findAll(filters);
  }

  async getCityById(id) {
    const city = await cityRepository.findById(id);
    if (!city) {
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
