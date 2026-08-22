const tripRepository = require('../repositories/tripRepository');
const tripSectionRepository = require('../repositories/tripSectionRepository');
const cityRepository = require('../repositories/cityRepository');
const ApiError = require('../utils/ApiError');

const calculateTripStatus = (startDate, endDate) => {
  const today = new Date().toISOString().split('T')[0];
  if (today < startDate) return 'UPCOMING';
  if (today > endDate) return 'COMPLETED';
  return 'ONGOING';
};

class CalendarService {
  async getUserCalendarTrips(userId, { month, year } = {}) {
    let targetMonth = null;
    let targetYear = null;

    if (month !== undefined && month !== null && month !== '') {
      targetMonth = parseInt(month, 10);
      if (isNaN(targetMonth) || targetMonth < 1 || targetMonth > 12) {
        throw ApiError.badRequest('Query parameter "month" must be an integer between 1 and 12.');
      }
    }

    if (year !== undefined && year !== null && year !== '') {
      targetYear = parseInt(year, 10);
      if (isNaN(targetYear) || targetYear < 1900 || targetYear > 2100) {
        throw ApiError.badRequest('Query parameter "year" must be a valid 4-digit year (e.g. 2026).');
      }
    }

    const result = await tripRepository.findByUserId(userId, { limit: 1000 });
    const trips = result.trips || [];

    let filteredTrips = trips;

    if (targetYear || targetMonth) {
      filteredTrips = filteredTrips.filter(t => {
        const tripStart = new Date(t.startDate);
        const tripEnd = new Date(t.endDate);

        const tripStartYear = tripStart.getUTCFullYear();
        const tripEndYear = tripEnd.getUTCFullYear();
        const tripStartMonth = tripStart.getUTCMonth() + 1; // 1-indexed
        const tripEndMonth = tripEnd.getUTCMonth() + 1;

        if (targetYear && targetMonth) {
          const targetStartDate = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
          const targetEndDate = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59));
          return tripStart <= targetEndDate && tripEnd >= targetStartDate;
        }

        if (targetYear) {
          return tripStartYear <= targetYear && tripEndYear >= targetYear;
        }

        if (targetMonth) {
          return tripStartMonth <= targetMonth && tripEndMonth >= targetMonth;
        }

        return true;
      });
    }

    const calendarItems = await Promise.all(
      filteredTrips.map(async (trip) => {
        const sections = await tripSectionRepository.findByTripId(trip.id);
        const sectionsWithCity = await Promise.all(
          sections.map(async (s) => {
            const city = await cityRepository.findById(s.cityId);
            return {
              id: s.id,
              cityName: city ? city.name : 'Unknown City',
              startDate: s.startDate,
              endDate: s.endDate
            };
          })
        );

        return {
          tripId: trip.id,
          name: trip.name,
          startDate: trip.startDate,
          endDate: trip.endDate,
          coverPhoto: trip.coverPhoto,
          visibility: trip.visibility,
          totalBudget: trip.totalBudget,
          status: calculateTripStatus(trip.startDate, trip.endDate),
          sections: sectionsWithCity
        };
      })
    );

    return calendarItems.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }
}

module.exports = new CalendarService();
