const { z } = require('zod');

const registerSchema = z.object({
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  name: z.string().trim().optional(),
  email: z.string().email('Invalid email address format').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  additionalInfo: z.string().optional().nullable(),
  homeCurrency: z.string().optional().nullable(),
  profilePhoto: z.string().url('Profile photo must be a valid URL').optional().nullable().or(z.literal(''))
}).refine((data) => data.name || data.firstName, {
  message: 'First name or full name is required'
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required')
});

module.exports = {
  registerSchema,
  loginSchema
};
