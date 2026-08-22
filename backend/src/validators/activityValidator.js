const { z } = require('zod');

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const idSchema = z.union([z.string().min(1), z.number()]);

const createDayActivitySchema = z.object({
  activityId: idSchema,
  startTime: z.string().regex(timeRegex, 'startTime must be in HH:mm 24-hour format (e.g., 10:00)').optional().nullable(),
  endTime: z.string().regex(timeRegex, 'endTime must be in HH:mm 24-hour format (e.g., 12:30)').optional().nullable(),
  customCost: z.number().min(0, 'customCost cannot be negative').optional().nullable(),
  notes: z.string().optional().nullable().or(z.literal('')),
  order: z.number().int().positive().optional()
}).refine(data => {
  if (data.startTime && data.endTime) {
    return data.startTime < data.endTime;
  }
  return true;
}, {
  message: 'startTime must be strictly before endTime',
  path: ['startTime']
});

const updateDayActivitySchema = z.object({
  activityId: idSchema.optional(),
  startTime: z.string().regex(timeRegex, 'startTime must be in HH:mm 24-hour format').optional().nullable(),
  endTime: z.string().regex(timeRegex, 'endTime must be in HH:mm 24-hour format').optional().nullable(),
  customCost: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable().or(z.literal('')),
  order: z.number().int().positive().optional()
}).refine(data => {
  if (data.startTime && data.endTime) {
    return data.startTime < data.endTime;
  }
  return true;
}, {
  message: 'startTime must be strictly before endTime',
  path: ['startTime']
});

const reorderDayActivitiesSchema = z.object({
  activityIds: z.array(idSchema).min(1, 'activityIds must contain at least 1 ID')
});

module.exports = {
  createDayActivitySchema,
  updateDayActivitySchema,
  reorderDayActivitiesSchema
};
