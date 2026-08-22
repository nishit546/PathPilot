const { z } = require('zod');

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const expenseCategories = ['TRANSPORT', 'STAY', 'FOOD', 'ACTIVITY', 'OTHER'];

const createExpenseSchema = z.object({
  category: z.enum(expenseCategories, {
    errorMap: () => ({ message: `category must be one of: ${expenseCategories.join(', ')}` })
  }),
  amount: z.number().positive('amount must be a positive number greater than 0'),
  description: z.string().optional().nullable().or(z.literal('')),
  date: z.string().regex(dateRegex, 'date must be in YYYY-MM-DD format').optional(),
  sectionId: z.number().int().positive().optional().nullable(),
  dayId: z.number().int().positive().optional().nullable()
});

const updateExpenseSchema = z.object({
  category: z.enum(expenseCategories).optional(),
  amount: z.number().positive('amount must be a positive number greater than 0').optional(),
  description: z.string().optional().nullable().or(z.literal('')),
  date: z.string().regex(dateRegex, 'date must be in YYYY-MM-DD format').optional(),
  sectionId: z.number().int().positive().optional().nullable(),
  dayId: z.number().int().positive().optional().nullable()
});

module.exports = {
  createExpenseSchema,
  updateExpenseSchema
};
