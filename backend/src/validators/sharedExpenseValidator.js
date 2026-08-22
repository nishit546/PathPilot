const { z } = require('zod');

const idSchema = z.union([z.string().min(1), z.number()]);

const splitItemSchema = z.object({
  userId: idSchema,
  amount: z.number().nonnegative().optional(),
  percentage: z.number().nonnegative().max(100).optional()
});

const createSharedExpenseSchema = z.object({
  title: z.string().min(2, { message: 'Title must be at least 2 characters' }).max(100),
  description: z.string().max(500).optional(),
  amount: z.number().positive({ message: 'Amount must be greater than 0' }),
  category: z.enum([
    'TRANSPORT',
    'STAY',
    'FOOD',
    'ACTIVITIES',
    'SHOPPING',
    'OTHER'
  ]).optional().default('OTHER'),
  paidBy: idSchema,
  splitType: z.enum(['EQUAL', 'EXACT', 'PERCENTAGE']),
  participants: z.array(idSchema).optional(),
  splits: z.array(splitItemSchema).optional()
}).superRefine((val, ctx) => {
  if (val.splitType === 'EQUAL') {
    if (!val.participants || val.participants.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['participants'],
        message: 'Participants array is required for EQUAL split.'
      });
    }
  } else if (val.splitType === 'EXACT') {
    if (!val.splits || val.splits.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['splits'],
        message: 'Splits array is required for EXACT split.'
      });
    } else {
      const sum = val.splits.reduce((acc, s) => acc + (s.amount || 0), 0);
      if (Math.abs(sum - val.amount) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['splits'],
          message: `The sum of exact split amounts (${sum}) must equal the total expense amount (${val.amount}).`
        });
      }
    }
  } else if (val.splitType === 'PERCENTAGE') {
    if (!val.splits || val.splits.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['splits'],
        message: 'Splits array is required for PERCENTAGE split.'
      });
    } else {
      const sum = val.splits.reduce((acc, s) => acc + (s.percentage || 0), 0);
      if (Math.abs(sum - 100) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['splits'],
          message: `The sum of split percentages (${sum}%) must equal exactly 100%.`
        });
      }
    }
  }
});

const updateSharedExpenseSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  amount: z.number().positive().optional(),
  category: z.enum([
    'TRANSPORT',
    'STAY',
    'FOOD',
    'ACTIVITIES',
    'SHOPPING',
    'OTHER'
  ]).optional(),
  paidBy: idSchema.optional(),
  splitType: z.enum(['EQUAL', 'EXACT', 'PERCENTAGE']).optional(),
  participants: z.array(idSchema).optional(),
  splits: z.array(splitItemSchema).optional()
});

const sharedExpenseQuerySchema = z.object({
  page: z.union([z.string().regex(/^\d+$/).transform(Number), z.number()]).optional(),
  limit: z.union([z.string().regex(/^\d+$/).transform(Number), z.number()]).optional(),
  category: z.string().optional(),
  paidBy: idSchema.optional(),
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional()
});

module.exports = {
  createSharedExpenseSchema,
  updateSharedExpenseSchema,
  sharedExpenseQuerySchema
};
