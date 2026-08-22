const { z } = require('zod');

const idSchema = z.union([z.string().min(1), z.number()]);

const inviteCollaboratorSchema = z.object({
  userId: idSchema,
  role: z.enum(['EDITOR', 'VIEWER'], {
    errorMap: () => ({ message: 'role must be either EDITOR or VIEWER' })
  })
});

const updateCollaboratorRoleSchema = z.object({
  role: z.enum(['EDITOR', 'VIEWER'], {
    errorMap: () => ({ message: 'role must be either EDITOR or VIEWER' })
  })
});

module.exports = {
  inviteCollaboratorSchema,
  updateCollaboratorRoleSchema
};
