const { z } = require('zod');

const createPostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').trim(),
  content: z.string().min(10, 'Content must be at least 10 characters').trim(),
  imageUrl: z.string().url('imageUrl must be a valid URL').optional().nullable().or(z.literal('')),
  tripId: z.number().int().positive().optional().nullable()
});

const updatePostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').trim().optional(),
  content: z.string().min(10, 'Content must be at least 10 characters').trim().optional(),
  imageUrl: z.string().url('imageUrl must be a valid URL').optional().nullable().or(z.literal('')),
  tripId: z.number().int().positive().optional().nullable()
});

module.exports = {
  createPostSchema,
  updatePostSchema
};
