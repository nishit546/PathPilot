const { z } = require('zod');

const createTemplateSchema = z.object({
  name: z.string().min(3, { message: 'Template name must be at least 3 characters' }).max(100),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().optional().default(false),
  category: z.enum([
    'ADVENTURE',
    'CULTURE',
    'NATURE',
    'FOOD',
    'RELAXATION',
    'ENTERTAINMENT',
    'SHOPPING',
    'OTHER'
  ]).optional().default('OTHER'),
  coverPhoto: z.string().url({ message: 'coverPhoto must be a valid URL' }).optional().nullable()
});

const updateTemplateSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().optional(),
  category: z.enum([
    'ADVENTURE',
    'CULTURE',
    'NATURE',
    'FOOD',
    'RELAXATION',
    'ENTERTAINMENT',
    'SHOPPING',
    'OTHER'
  ]).optional(),
  coverPhoto: z.string().url().optional().nullable()
});

const useTemplateSchema = z.object({
  tripName: z.string().min(3).max(100).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate must be in YYYY-MM-DD format' }),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate must be in YYYY-MM-DD format' }),
  budget: z.number().nonnegative().optional(),
  visibility: z.enum(['PRIVATE', 'PUBLIC']).optional().default('PRIVATE')
});

const duplicateTripSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate must be in YYYY-MM-DD format' }).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate must be in YYYY-MM-DD format' }).optional(),
  totalBudget: z.number().nonnegative().optional()
});

module.exports = {
  createTemplateSchema,
  updateTemplateSchema,
  useTemplateSchema,
  duplicateTripSchema
};
