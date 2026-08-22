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

const updateProfileSchema = z.object({
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  name: z.string().trim().optional(),
  phone: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  additionalInfo: z.string().optional().nullable(),
  homeCurrency: z.string().optional().nullable(),
  profilePhoto: z.string().url('Profile photo must be a valid URL').optional().nullable().or(z.literal(''))
});

const userPreferencesSchema = z.object({
  interests: z.array(z.enum(ALLOWED_CATEGORIES, {
    errorMap: () => ({ message: `interests must contain valid categories: ${ALLOWED_CATEGORIES.join(', ')}` })
  })).optional().default([]),
  preferredCountries: z.array(z.string().min(1)).optional().default([]),
  budgetLevel: z.enum(['LOW', 'MEDIUM', 'HIGH'], {
    errorMap: () => ({ message: 'budgetLevel must be one of: LOW, MEDIUM, HIGH' })
  }).optional().default('MEDIUM')
});

module.exports = {
  updateProfileSchema,
  userPreferencesSchema
};
