const { z } = require('zod');

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const createSectionSchema = z.object({
  cityId: z.number().int().positive('cityId must be a valid positive integer'),
  startDate: z.string().regex(dateRegex, 'startDate must be in YYYY-MM-DD format'),
  endDate: z.string().regex(dateRegex, 'endDate must be in YYYY-MM-DD format'),
  budget: z.number().min(0, 'budget must be at least 0').optional().default(0),
  order: z.number().int().positive().optional()
}).refine(data => {
  return new Date(data.startDate) <= new Date(data.endDate);
}, {
  message: 'Section startDate cannot be after endDate',
  path: ['startDate']
});

const updateSectionSchema = z.object({
  cityId: z.number().int().positive().optional(),
  startDate: z.string().regex(dateRegex, 'startDate must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(dateRegex, 'endDate must be in YYYY-MM-DD format').optional(),
  budget: z.number().min(0).optional(),
  order: z.number().int().positive().optional()
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: 'Section startDate cannot be after endDate',
  path: ['startDate']
});

const reorderSectionsSchema = z.object({
  sectionIds: z.array(z.number().int().positive()).min(1, 'sectionIds must contain at least 1 ID')
});

module.exports = {
  createSectionSchema,
  updateSectionSchema,
  reorderSectionsSchema
};
