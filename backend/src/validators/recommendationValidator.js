const { z } = require('zod');

const ALLOWED_CATEGORIES = [
  'ADVENTURE',
  'CULTURE',
  'NATURE',
  'FOOD',
  'RELAXATION',
  'ENTERTAINMENT',
  'SHOPPING'
];

const tripRecommendationSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate must be in YYYY-MM-DD format' }),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate must be in YYYY-MM-DD format' }),
  budget: z.number().min(0, { message: 'budget must be a non-negative number' }),
  interests: z.array(z.enum(ALLOWED_CATEGORIES, {
    errorMap: () => ({ message: `interests must contain valid categories: ${ALLOWED_CATEGORIES.join(', ')}` })
  })).optional().default([]),
  preferredCountries: z.array(z.string().min(1)).optional().default([]),
  maxCities: z.number().int().min(1, { message: 'maxCities must be at least 1' }).max(5, { message: 'maxCities cannot exceed 5' }).optional().default(3)
}).refine((data) => data.startDate <= data.endDate, {
  message: 'startDate cannot be after endDate',
  path: ['startDate']
});

const budgetOptimizerSchema = z.object({
  budget: z.number().min(0, { message: 'budget must be a non-negative number' }),
  cities: z.array(z.union([z.number().int().positive(), z.string().min(1)])).optional().default([]),
  activities: z.array(z.union([z.number().int().positive(), z.string().min(1)])).optional().default([]),
  durationDays: z.number().int().min(1).max(60).optional().default(7)
});

const itinerarySuggestionSchema = z.object({
  tripId: z.union([
    z.string().min(1, { message: 'tripId must not be empty' }),
    z.number().int().positive({ message: 'tripId must be a positive integer' })
  ])
});

module.exports = {
  tripRecommendationSchema,
  budgetOptimizerSchema,
  itinerarySuggestionSchema
};
