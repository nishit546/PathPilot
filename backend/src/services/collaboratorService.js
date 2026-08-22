const tripRepository = require('../repositories/tripRepository');
const tripCollaboratorRepository = require('../repositories/tripCollaboratorRepository');
const tripActivityLogRepository = require('../repositories/tripActivityLogRepository');
const userRepository = require('../repositories/userRepository');
const tripAccessService = require('./tripAccessService');
const notificationService = require('./notificationService');
const ApiError = require('../utils/ApiError');
const { parsePagination } = require('../utils/pagination');
const { parseSort } = require('../utils/sortHelper');

const calculateTripStatus = (startDate, endDate) => {
  const today = new Date().toISOString().split('T')[0];
  if (today < startDate) return 'UPCOMING';
  if (today > endDate) return 'COMPLETED';
  return 'ONGOING';
};

class CollaboratorService {
  /**
   * Invites a new collaborator to a trip.
   */
  async inviteCollaborator(tripId, ownerId, data) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      throw ApiError.notFound('Trip not found.');
    }

    if (String(trip.userId) !== String(ownerId)) {
      throw ApiError.forbidden('Only the trip owner can invite collaborators.');
    }

    const targetUserId = data.userId;

    // Cannot invite self / owner
    if (String(targetUserId) === String(trip.userId)) {
      throw ApiError.badRequest('The trip owner cannot be added as a collaborator.');
    }

    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      throw ApiError.notFound('Invited user not found.');
    }

    if (targetUser.isBlocked) {
      throw ApiError.badRequest('Cannot invite a blocked user.');
    }

    const existing = await tripCollaboratorRepository.findByTripAndUser(trip.id, targetUserId);
    if (existing) {
      throw ApiError.conflict('This user is already a collaborator on this trip.');
    }

    const created = await tripCollaboratorRepository.create({
      tripId: trip.id,
      userId: targetUserId,
      role: data.role
    });

    // Record activity log
    await tripActivityLogRepository.create({
      tripId: trip.id,
      userId: ownerId,
      action: 'COLLABORATOR_ADDED',
      description: `Invited ${targetUser.firstName} ${targetUser.lastName} as ${data.role}`
    });

    // Create Notification for the invited user
    await notificationService.createNotification({
      userId: targetUserId,
      type: 'TRIP_INVITATION',
      title: 'You were added to a trip',
      message: `You were added as an ${data.role} to "${trip.name}".`,
      relatedTripId: trip.id,
      relatedUserId: ownerId,
      metadata: { role: data.role },
      preventDuplicate: false
    });

    return {
      ...created,
      user: {
        id: targetUser.id,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        email: targetUser.email,
        profilePhoto: targetUser.profilePhoto
      }
    };
  }

  /**
   * Retrieves all collaborators on a trip.
   */
  async getCollaborators(tripId, userId) {
    const { trip } = await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);

    const owner = await userRepository.findById(trip.userId);
    const collaboratorRecords = await tripCollaboratorRepository.findByTripId(trip.id);

    const populatedCollaborators = await Promise.all(
      collaboratorRecords.map(async (c) => {
        const u = await userRepository.findById(c.userId);
        return {
          id: c.id,
          tripId: c.tripId,
          userId: c.userId,
          role: c.role,
          createdAt: c.createdAt,
          user: u ? {
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            profilePhoto: u.profilePhoto
          } : null
        };
      })
    );

    return {
      tripId: trip.id,
      owner: owner ? {
        id: owner.id,
        firstName: owner.firstName,
        lastName: owner.lastName,
        email: owner.email,
        profilePhoto: owner.profilePhoto
      } : null,
      collaborators: populatedCollaborators
    };
  }

  /**
   * Updates an existing collaborator's role.
   */
  async updateCollaboratorRole(tripId, ownerId, targetUserId, newRole) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      throw ApiError.notFound('Trip not found.');
    }

    if (String(trip.userId) !== String(ownerId)) {
      throw ApiError.forbidden('Only the trip owner can modify collaborator roles.');
    }

    if (String(targetUserId) === String(trip.userId)) {
      throw ApiError.badRequest('Cannot modify the trip owner’s role.');
    }

    const existing = await tripCollaboratorRepository.findByTripAndUser(trip.id, targetUserId);
    if (!existing) {
      throw ApiError.notFound('Collaborator not found on this trip.');
    }

    const updated = await tripCollaboratorRepository.updateRole(trip.id, targetUserId, newRole);
    const targetUser = await userRepository.findById(targetUserId);

    // Record activity log
    await tripActivityLogRepository.create({
      tripId: trip.id,
      userId: ownerId,
      action: 'ROLE_UPDATED',
      description: `Updated ${targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : 'collaborator'} role to ${newRole}`
    });

    // Create Notification for the collaborator
    await notificationService.createNotification({
      userId: targetUserId,
      type: 'ROLE_CHANGED',
      title: 'Collaboration Role Updated',
      message: `Your role in "${trip.name}" was changed to ${newRole}.`,
      relatedTripId: trip.id,
      relatedUserId: ownerId,
      metadata: { newRole },
      preventDuplicate: false
    });

    return {
      ...updated,
      user: targetUser ? {
        id: targetUser.id,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        email: targetUser.email,
        profilePhoto: targetUser.profilePhoto
      } : null
    };
  }

  /**
   * Removes a collaborator from a trip.
   */
  async removeCollaborator(tripId, requesterId, targetUserId) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      throw ApiError.notFound('Trip not found.');
    }

    const isOwner = String(trip.userId) === String(requesterId);
    const isSelfLeaving = String(targetUserId) === String(requesterId);

    if (!isOwner && !isSelfLeaving) {
      throw ApiError.forbidden('You do not have permission to remove this collaborator.');
    }

    if (String(targetUserId) === String(trip.userId)) {
      throw ApiError.badRequest('The trip owner cannot be removed from the trip.');
    }

    const existing = await tripCollaboratorRepository.findByTripAndUser(trip.id, targetUserId);
    if (!existing) {
      throw ApiError.notFound('Collaborator not found on this trip.');
    }

    await tripCollaboratorRepository.delete(trip.id, targetUserId);

    const targetUser = await userRepository.findById(targetUserId);
    const requesterUser = await userRepository.findById(requesterId);

    // Record activity log
    await tripActivityLogRepository.create({
      tripId: trip.id,
      userId: requesterId,
      action: isSelfLeaving ? 'COLLABORATOR_LEFT' : 'COLLABORATOR_REMOVED',
      description: isSelfLeaving
        ? `${targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : 'User'} left the trip`
        : `Removed ${targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : 'collaborator'} from trip`
    });

    if (isSelfLeaving) {
      // Notify owner that collaborator left
      await notificationService.createNotification({
        userId: trip.userId,
        type: 'COLLABORATOR_LEFT',
        title: 'Collaborator Left Trip',
        message: `${targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : 'A user'} left "${trip.name}".`,
        relatedTripId: trip.id,
        relatedUserId: targetUserId,
        preventDuplicate: false
      });
    } else {
      // Notify removed user
      await notificationService.createNotification({
        userId: targetUserId,
        type: 'COLLABORATOR_REMOVED',
        title: 'Removed From Trip',
        message: `You were removed from "${trip.name}".`,
        relatedTripId: trip.id,
        relatedUserId: requesterId,
        preventDuplicate: false
      });
    }

    return { message: 'Collaborator removed successfully.' };
  }

  /**
   * Retrieves trips shared with the authenticated user.
   */
  async getSharedWithMeTrips(userId, query = {}) {
    const collaborations = await tripCollaboratorRepository.findByUserId(userId);

    let trips = [];
    for (const col of collaborations) {
      const trip = await tripRepository.findById(col.tripId);
      if (trip) {
        const owner = await userRepository.findById(trip.userId);
        const status = calculateTripStatus(trip.startDate, trip.endDate);
        trips.push({
          ...trip,
          status,
          collaborationRole: col.role,
          joinedAt: col.createdAt,
          owner: owner ? {
            id: owner.id,
            firstName: owner.firstName,
            lastName: owner.lastName,
            email: owner.email,
            profilePhoto: owner.profilePhoto
          } : null
        });
      }
    }

    // Role filter
    if (query.role) {
      const roleFilter = query.role.toUpperCase();
      trips = trips.filter((t) => t.collaborationRole === roleFilter);
    }

    // Status filter
    if (query.status) {
      const statusFilter = query.status.toUpperCase();
      trips = trips.filter((t) => t.status === statusFilter);
    }

    // Search filter
    if (query.search || query.q) {
      const q = (query.search || query.q).toLowerCase();
      trips = trips.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Sorting
    const sort = parseSort(query.sortBy, query.order, ['name', 'startDate', 'endDate', 'createdAt', 'totalBudget']);
    if (sort) {
      trips.sort((a, b) => {
        let valA = a[sort.field];
        let valB = b[sort.field];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sort.order === 'asc' ? -1 : 1;
        if (valA > valB) return sort.order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Pagination
    const { page, limit, offset } = parsePagination(query);
    const total = trips.length;
    const paginatedTrips = trips.slice(offset, offset + limit);

    return {
      trips: paginatedTrips,
      total,
      page,
      limit
    };
  }

  /**
   * Retrieves trip activity logs with pagination.
   */
  async getActivityLogs(tripId, userId, query = {}) {
    await tripAccessService.requirePermission(tripId, userId, ['OWNER', 'EDITOR', 'VIEWER']);
    const allLogs = await tripActivityLogRepository.findByTripId(tripId);
    const { page, limit, offset } = parsePagination(query);
    const total = allLogs.length;
    const paginatedLogs = allLogs.slice(offset, offset + limit);
    return {
      logs: paginatedLogs,
      total,
      page,
      limit
    };
  }
}

module.exports = new CollaboratorService();
