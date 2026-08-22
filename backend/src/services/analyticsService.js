const userRepository = require('../repositories/userRepository');
const tripRepository = require('../repositories/tripRepository');
const communityRepository = require('../repositories/communityRepository');
const expenseRepository = require('../repositories/expenseRepository');
const cityRepository = require('../repositories/cityRepository');
const activityRepository = require('../repositories/activityRepository');
const mockDb = require('../repositories/mockDatabase');

const calculateTripStatus = (startDate, endDate) => {
  const today = new Date().toISOString().split('T')[0];
  if (today < startDate) return 'UPCOMING';
  if (today > endDate) return 'COMPLETED';
  return 'ONGOING';
};

class AnalyticsService {
  async getAdminAnalytics() {
    const totalUsers = await userRepository.count();
    const activeUsers = mockDb.users.filter(u => !u.isBlocked).length;
    const blockedUsers = mockDb.users.filter(u => u.isBlocked).length;
    const totalTrips = await tripRepository.count();
    const totalCommunityPosts = await communityRepository.count();
    const totalExpensesTracked = await expenseRepository.totalAmount();

    // Trips by status & timeline
    const allTrips = await tripRepository.findAll();
    const tripsByStatus = {
      UPCOMING: 0,
      ONGOING: 0,
      COMPLETED: 0
    };

    const tripsByMonth = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    monthNames.forEach(m => { tripsByMonth[m] = 0; });

    allTrips.forEach(t => {
      const status = calculateTripStatus(t.startDate, t.endDate);
      if (tripsByStatus[status] !== undefined) {
        tripsByStatus[status] += 1;
      }

      const tripDate = new Date(t.startDate);
      const mIdx = tripDate.getUTCMonth();
      const mName = monthNames[mIdx];
      if (mName) {
        tripsByMonth[mName] = (tripsByMonth[mName] || 0) + 1;
      }
    });

    // Most popular cities
    const { cities } = await cityRepository.findAll({ sort: 'popularity', limit: 5 });
    const mostPopularCities = cities.map(c => ({
      id: c.id,
      name: c.name,
      country: c.country,
      popularity: c.popularity
    }));

    // Activity counts by category
    const { activities } = await activityRepository.findAll({ limit: 100 });
    const activityCategoryCounts = {};
    activities.forEach(a => {
      activityCategoryCounts[a.category] = (activityCategoryCounts[a.category] || 0) + 1;
    });

    const mostPopularActivityCategories = Object.entries(activityCategoryCounts).map(
      ([category, count]) => ({ category, count })
    );

    return {
      overview: {
        totalUsers,
        activeUsers,
        blockedUsers,
        totalTrips,
        totalCommunityPosts,
        totalExpensesTracked
      },
      tripsByStatus,
      tripsByMonth,
      mostPopularCities,
      mostPopularActivityCategories
    };
  }
}

module.exports = new AnalyticsService();
