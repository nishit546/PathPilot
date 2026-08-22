const { z } = require('zod');

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const createTripSchema = z.object({
  name: z.string().min(2, 'Trip name must be at least 2 characters').trim(),
  description: z.string().optional().nullable().or(z.literal('')),
  coverPhoto: z.string().url('Cover photo must be a valid URL').optional().nullable().or(z.literal('')),
  startDate: z.string().regex(dateRegex, 'startDate must be in YYYY-MM-DD format'),
  endDate: z.string().regex(dateRegex, 'endDate must be in YYYY-MM-DD format'),
  totalBudget: z.number().min(0, 'totalBudget must be greater than or equal to 0').optional().default(0),
  visibility: z.enum(['PRIVATE', 'PUBLIC']).optional().default('PRIVATE')
}).refine(data => {
  return new Date(data.startDate) <= new Date(data.endDate);
}, {
  message: 'startDate cannot be after endDate',
  path: ['startDate']
});

const updateTripSchema = z.object({
  name: z.string().min(2, 'Trip name must be at least 2 characters').trim().optional(),
  description: z.string().optional().nullable().or(z.literal('')),
  coverPhoto: z.string().url('Cover photo must be a valid URL').optional().nullable().or(z.literal('')),
  startDate: z.string().regex(dateRegex, 'startDate must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(dateRegex, 'endDate must be in YYYY-MM-DD format').optional(),
  totalBudget: z.number().min(0, 'totalBudget must be greater than or equal to 0').optional(),
  visibility: z.enum(['PRIVATE', 'PUBLIC']).optional()
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: 'startDate cannot be after endDate',
  path: ['startDate']
});

module.exports = {
  createTripSchema,
  updateTripSchema
};
