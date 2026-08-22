const { z } = require('zod');

const idSchema = z.union([z.string().min(1), z.number()]);

const createPostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').trim(),
  content: z.string().min(10, 'Content must be at least 10 characters').trim(),
  imageUrl: z.string().url('imageUrl must be a valid URL').optional().nullable().or(z.literal('')),
  tripId: idSchema.optional().nullable()
});

const updatePostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').trim().optional(),
  content: z.string().min(10, 'Content must be at least 10 characters').trim().optional(),
  imageUrl: z.string().url('imageUrl must be a valid URL').optional().nullable().or(z.literal('')),
  tripId: idSchema.optional().nullable()
});

module.exports = {
  createPostSchema,
  updatePostSchema
};
