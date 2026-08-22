const { z } = require('zod');

const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').trim().optional(),
  lastName: z.string().min(1, 'Last name cannot be empty').trim().optional(),
  phone: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  additionalInfo: z.string().optional().nullable(),
  profilePhoto: z.string().url('Profile photo must be a valid URL').optional().nullable().or(z.literal(''))
});

module.exports = {
  updateProfileSchema
};
