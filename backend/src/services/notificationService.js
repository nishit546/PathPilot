const notificationRepository = require('../repositories/notificationRepository');
const tripRepository = require('../repositories/tripRepository');
const tripCollaboratorRepository = require('../repositories/tripCollaboratorRepository');
const ApiError = require('../utils/ApiError');

class NotificationService {
  /**
   * Creates a notification for a single user with optional duplicate prevention.
   */
  async createNotification({
    userId,
    type,
    title,
    message,
    relatedTripId = null,
    relatedUserId = null,
    metadata = null,
    preventDuplicate = true
  }) {
    if (preventDuplicate && relatedTripId) {
      const existing = await notificationRepository.findExistingSimilarNotification(
        userId,
        relatedTripId,
        type
      );
      if (existing) {
        return existing;
      }
    }

    return notificationRepository.create({
      userId,
      type,
      title,
      message,
      relatedTripId,
      relatedUserId,
      metadata
    });
  }

  /**
   * Broadcasts a notification to all collaborators and owner of a trip.
   */
  async notifyTripMembers(tripId, actorUserId, { type, title, message, metadata = null, excludeActor = true, preventDuplicate = true }) {
    const trip = await tripRepository.findById(tripId);
    if (!trip) return [];

    const collaborators = await tripCollaboratorRepository.findByTripId(trip.id);
    const recipientIds = new Set();

    recipientIds.add(String(trip.userId));
    collaborators.forEach((c) => recipientIds.add(String(c.userId)));

    if (excludeActor && actorUserId) {
      recipientIds.delete(String(actorUserId));
    }

    const createdNotifications = [];
    for (const recipientId of recipientIds) {
      const notif = await this.createNotification({
        userId: recipientId,
        type,
        title,
        message,
        relatedTripId: trip.id,
        relatedUserId: actorUserId ? String(actorUserId) : null,
        metadata,
        preventDuplicate
      });
      createdNotifications.push(notif);
    }

    return createdNotifications;
  }

  /**
   * Checks budget threshold and triggers appropriate alert notifications.
   */
  async checkAndTriggerBudgetAlert(tripId, totalSpent, totalBudget, actorId = null) {
    if (!totalBudget || totalBudget <= 0) return null;

    const usageRatio = totalSpent / totalBudget;
    const trip = await tripRepository.findById(tripId);
    if (!trip) return null;

    if (usageRatio >= 1.0) {
      return this.notifyTripMembers(trip.id, actorId, {
        type: 'BUDGET_EXCEEDED',
        title: 'Budget Limit Exceeded',
        message: `Your trip "${trip.name}" has exceeded its total budget of ₹${totalBudget.toLocaleString()} (Total expenditure: ₹${totalSpent.toLocaleString()}).`,
        metadata: { totalBudget, totalSpent, percentageUsed: Math.round(usageRatio * 100) },
        excludeActor: false, // Ensure all members are aware
        preventDuplicate: true
      });
    } else if (usageRatio >= 0.8) {
      return this.notifyTripMembers(trip.id, actorId, {
        type: 'BUDGET_WARNING',
        title: 'Budget Alert (80% Reached)',
        message: `You have used ${Math.round(usageRatio * 100)}% of your budget for "${trip.name}" (₹${totalSpent.toLocaleString()} of ₹${totalBudget.toLocaleString()}).`,
        metadata: { totalBudget, totalSpent, percentageUsed: Math.round(usageRatio * 100) },
        excludeActor: false,
        preventDuplicate: true
      });
    }

    return null;
  }

  /**
   * Retrieves notifications for authenticated user.
   */
  async getUserNotifications(userId, query = {}) {
    return notificationRepository.findByUser(userId, query);
  }

  /**
   * Retrieves unread notification count.
   */
  async getUnreadCount(userId) {
    return notificationRepository.getUnreadCount(userId);
  }

  /**
   * Marks a notification as read.
   */
  async markAsRead(id, userId) {
    const notification = await notificationRepository.findById(id);
    if (!notification) {
      throw ApiError.notFound('Notification not found.');
    }

    if (String(notification.userId) !== String(userId)) {
      throw ApiError.forbidden('You do not have access to this notification.');
    }

    const updated = await notificationRepository.markAsRead(id);
    return updated;
  }

  /**
   * Marks all notifications belonging to user as read.
   */
  async markAllAsRead(userId) {
    const updatedCount = await notificationRepository.markAllAsRead(userId);
    return { updatedCount };
  }

  /**
   * Deletes a single notification.
   */
  async deleteNotification(id, userId) {
    const notification = await notificationRepository.findById(id);
    if (!notification) {
      throw ApiError.notFound('Notification not found.');
    }

    if (String(notification.userId) !== String(userId)) {
      throw ApiError.forbidden('You do not have access to this notification.');
    }

    await notificationRepository.delete(id);
    return { message: 'Notification deleted successfully.' };
  }

  /**
   * Clears all notifications belonging to user.
   */
  async clearAllNotifications(userId) {
    const deletedCount = await notificationRepository.deleteAll(userId);
    return { deletedCount };
  }
}

module.exports = new NotificationService();
