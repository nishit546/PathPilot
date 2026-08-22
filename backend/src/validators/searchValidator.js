const { z } = require('zod');

const orderEnum = z.enum(['ASC', 'DESC', 'asc', 'desc']).optional().default('desc');

const globalSearchSchema = z.object({
  q: z.string().max(100).optional().default(''),
  type: z.enum(['ALL', 'TRIPS', 'CITIES', 'ACTIVITIES', 'TEMPLATES', 'COMMUNITY']).optional().default('ALL'),
  page: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional().default(1),
  limit: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional().default(20),
  sortBy: z.string().optional(),
  order: orderEnum
});

const tripSearchSchema = z.object({
  q: z.string().max(100).optional().default(''),
  status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'upcoming', 'ongoing', 'completed']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  minBudget: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
  maxBudget: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
  city: z.string().max(100).optional(),
  sortBy: z.enum(['NAME', 'START_DATE', 'END_DATE', 'BUDGET', 'CREATED_AT', 'UPDATED_AT', 'name', 'startDate', 'endDate', 'budget', 'createdAt', 'updatedAt']).optional().default('CREATED_AT'),
  order: orderEnum,
  page: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional().default(1),
  limit: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional().default(20)
});

const activitySearchSchema = z.object({
  q: z.string().max(100).optional().default(''),
  category: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  minCost: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
  maxCost: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
  minDuration: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
  maxDuration: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
  sortBy: z.enum(['NAME', 'COST', 'DURATION', 'POPULARITY', 'name', 'cost', 'duration', 'popularity']).optional().default('POPULARITY'),
  order: orderEnum,
  page: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional().default(1),
  limit: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional().default(20)
});

const citySearchSchema = z.object({
  q: z.string().max(100).optional().default(''),
  country: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  minCostIndex: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
  maxCostIndex: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
  sortBy: z.enum(['NAME', 'POPULARITY', 'COST_INDEX', 'name', 'popularity', 'costIndex']).optional().default('POPULARITY'),
  order: orderEnum,
  page: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional().default(1),
  limit: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional().default(20)
});

const templateSearchSchema = z.object({
  q: z.string().max(100).optional().default(''),
  category: z.string().max(50).optional(),
  minDuration: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
  maxDuration: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
  minCost: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
  maxCost: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
  sortBy: z.enum(['POPULARITY', 'NEWEST', 'COST', 'DURATION', 'FAVORITES', 'COPIES', 'popularity', 'newest', 'cost', 'duration', 'favorites', 'copies']).optional().default('POPULARITY'),
  order: orderEnum,
  page: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional().default(1),
  limit: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional().default(20)
});

const communitySearchSchema = z.object({
  q: z.string().max(100).optional().default(''),
  category: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  sortBy: z.enum(['NEWEST', 'POPULARITY', 'LIKES', 'COMMENTS', 'newest', 'popularity', 'likes', 'comments']).optional().default('NEWEST'),
  order: orderEnum,
  page: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional().default(1),
  limit: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional().default(20)
});

const suggestionsSchema = z.object({
  q: z.string().min(2, { message: 'Query must be at least 2 characters for suggestions' }).max(100)
});

module.exports = {
  globalSearchSchema,
  tripSearchSchema,
  activitySearchSchema,
  citySearchSchema,
  templateSearchSchema,
  communitySearchSchema,
  suggestionsSchema
};
