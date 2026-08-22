const userRepository = require('../repositories/userRepository');
const tripRepository = require('../repositories/tripRepository');
const tripSectionRepository = require('../repositories/tripSectionRepository');
const dayRepository = require('../repositories/dayRepository');
const expenseRepository = require('../repositories/expenseRepository');
const ApiError = require('../utils/ApiError');

const calculateTripStatus = (startDate, endDate) => {
  const today = new Date().toISOString().split('T')[0];
  if (today < startDate) return 'UPCOMING';
  if (today > endDate) return 'COMPLETED';
  return 'ONGOING';
};

class UserService {
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async updateProfile(userId, updateData) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const updatedUser = await userRepository.update(userId, updateData);
    return updatedUser;
  }

  async deleteProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    // Cascade delete user's trips, sections, days, expenses
    const result = await tripRepository.findByUserId(userId, { limit: 1000 });
    const trips = result.trips || [];
    for (const trip of trips) {
      await tripSectionRepository.deleteByTripId(trip.id);
      await dayRepository.deleteByTripId(trip.id);
      await expenseRepository.deleteByTripId(trip.id);
      await tripRepository.delete(trip.id);
    }

    await userRepository.delete(userId);
    return { message: 'User profile and associated data deleted successfully.' };
  }

  async getProfileTrips(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const result = await tripRepository.findByUserId(userId, { limit: 1000 });
    const trips = result.trips || [];

    const upcoming = [];
    const ongoing = [];
    const completed = [];

    trips.forEach(trip => {
      const status = calculateTripStatus(trip.startDate, trip.endDate);
      const tripWithStatus = { ...trip, status };

      if (status === 'UPCOMING') upcoming.push(tripWithStatus);
      else if (status === 'ONGOING') ongoing.push(tripWithStatus);
      else completed.push(tripWithStatus);
    });

    return {
      totalTrips: trips.length,
      upcoming,
      ongoing,
      completed
    };
  }
}

module.exports = new UserService();
