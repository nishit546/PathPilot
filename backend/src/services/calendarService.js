const tripRepository = require('../repositories/tripRepository');
const tripSectionRepository = require('../repositories/tripSectionRepository');
const cityRepository = require('../repositories/cityRepository');

const calculateTripStatus = (startDate, endDate) => {
  const today = new Date().toISOString().split('T')[0];
  if (today < startDate) return 'UPCOMING';
  if (today > endDate) return 'COMPLETED';
  return 'ONGOING';
};

class CalendarService {
  async getUserCalendarTrips(userId, { month, year } = {}) {
    const result = await tripRepository.findByUserId(userId, { limit: 1000 });
    const trips = result.trips || [];

    let filteredTrips = trips;

    if (year || month) {
      filteredTrips = filteredTrips.filter(t => {
        const tripStart = new Date(t.startDate);
        const tripEnd = new Date(t.endDate);

        const tripStartYear = tripStart.getUTCFullYear();
        const tripEndYear = tripEnd.getUTCFullYear();
        const tripStartMonth = tripStart.getUTCMonth() + 1; // 1-indexed
        const tripEndMonth = tripEnd.getUTCMonth() + 1;

        if (year && month) {
          const targetYear = Number(year);
          const targetMonth = Number(month);
          // Check if date range intersects with target month/year
          const targetStartDate = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
          const targetEndDate = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59));
          return tripStart <= targetEndDate && tripEnd >= targetStartDate;
        }

        if (year) {
          const targetYear = Number(year);
          return tripStartYear <= targetYear && tripEndYear >= targetYear;
        }

        if (month) {
          const targetMonth = Number(month);
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
