const tripRepository = require('../repositories/tripRepository');
const tripCollaboratorRepository = require('../repositories/tripCollaboratorRepository');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/ApiError');

class TripAccessService {
  /**
   * Evaluates the authenticated user's role on a given trip.
   * @param {number|string} tripId
   * @param {number|string} [userId]
   * @returns {Promise<{ trip: object, role: 'OWNER' | 'EDITOR' | 'VIEWER' | 'PUBLIC_VIEWER' | null }>}
   */
  async getTripUserRole(tripId, userId) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      throw ApiError.notFound('Trip not found.');
    }

    if (!userId) {
      if (trip.visibility === 'PUBLIC') {
        return { trip, role: 'PUBLIC_VIEWER' };
      }
      return { trip, role: null };
    }

    const strUserId = String(userId);

    // 1. Is user the trip owner?
    if (String(trip.userId) === strUserId) {
      return { trip, role: 'OWNER' };
    }

    // 2. Is user a collaborator?
    const collaborator = await tripCollaboratorRepository.findByTripAndUser(trip.id, strUserId);
    if (collaborator) {
      // Check if collaborator account is blocked
      const user = await userRepository.findById(strUserId);
      if (user && user.isBlocked) {
        throw ApiError.forbidden('Your account is blocked.');
      }
      return { trip, role: collaborator.role };
    }

    // 3. Public visibility fallback
    if (trip.visibility === 'PUBLIC') {
      return { trip, role: 'PUBLIC_VIEWER' };
    }

    return { trip, role: null };
  }

  /**
   * Enforces role-based permissions for trip operations.
   * @param {number|string} tripId
   * @param {number|string} userId
   * @param {string[]} [allowedRoles=['OWNER', 'EDITOR', 'VIEWER']]
   * @returns {Promise<{ trip: object, role: string }>}
   */
  async requirePermission(tripId, userId, allowedRoles = ['OWNER', 'EDITOR', 'VIEWER']) {
    const { trip, role } = await this.getTripUserRole(tripId, userId);

    if (!role || (!allowedRoles.includes(role) && !(role === 'PUBLIC_VIEWER' && allowedRoles.includes('VIEWER')))) {
      throw ApiError.forbidden('You do not have permission to access or modify this trip.');
    }

    return { trip, role };
  }
}

module.exports = new TripAccessService();
