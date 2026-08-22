const { z } = require('zod');

const spendingAnalyticsSchema = z.object({
  tripId: z.union([z.number(), z.string().min(1)]).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate must be in YYYY-MM-DD format' }).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate must be in YYYY-MM-DD format' }).optional(),
  groupBy: z.enum(['DAY', 'MONTH', 'CATEGORY', 'TRIP', 'CITY']).optional().default('CATEGORY')
});

const timelineAnalyticsSchema = z.object({
  year: z.union([z.number(), z.string().regex(/^\d{4}$/).transform(Number)]).optional(),
  groupBy: z.enum(['MONTH', 'QUARTER']).optional().default('MONTH')
});

const compareTripsSchema = z.object({
  tripIds: z.string().min(1, { message: 'tripIds parameter is required' }).transform((val) => {
    return val.split(',').map((id) => id.trim()).filter(Boolean);
  }).refine((ids) => ids.length > 0, {
    message: 'All tripIds must be valid identifiers'
  }).refine((ids) => ids.length <= 5, {
    message: 'Cannot compare more than 5 trips at once'
  }).refine((ids) => new Set(ids).size === ids.length, {
    message: 'Duplicate trip IDs are not permitted for comparison'
  })
});

module.exports = {
  spendingAnalyticsSchema,
  timelineAnalyticsSchema,
  compareTripsSchema
};
