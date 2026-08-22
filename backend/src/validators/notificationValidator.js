const { z } = require('zod');

const notificationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  type: z.enum([
    'TRIP_INVITATION',
    'COLLABORATOR_ADDED',
    'COLLABORATOR_REMOVED',
    'ROLE_CHANGED',
    'TRIP_UPDATED',
    'ITINERARY_UPDATED',
    'ACTIVITY_ADDED',
    'ACTIVITY_REMOVED',
    'BUDGET_WARNING',
    'BUDGET_EXCEEDED',
    'TRIP_STARTING_SOON',
    'EMPTY_DAY',
    'OVERLOADED_DAY',
    'RECOMMENDATION_AVAILABLE',
    'TRIP_SHARED',
    'TRIP_COPIED',
    'SYSTEM'
  ]).optional(),
  isRead: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['createdAt', 'type', 'isRead']).optional(),
  order: z.enum(['asc', 'desc']).optional()
});

module.exports = {
  notificationQuerySchema
};
