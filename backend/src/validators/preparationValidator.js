const { z } = require('zod');

const idSchema = z.union([z.string().min(1), z.number()]);

const packingCategoryEnum = z.enum([
  'CLOTHING',
  'TOILETRIES',
  'ELECTRONICS',
  'DOCUMENTS',
  'MEDICINE',
  'ACCESSORIES',
  'ACTIVITY_GEAR',
  'OTHER'
]);

const createPackingItemSchema = z.object({
  name: z.string().min(2, { message: 'Item name must be at least 2 characters' }).max(100),
  category: packingCategoryEnum.optional().default('OTHER'),
  quantity: z.number().int().positive({ message: 'Quantity must be at least 1' }).optional().default(1),
  isEssential: z.boolean().optional().default(false)
});

const updatePackingItemSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  category: packingCategoryEnum.optional(),
  quantity: z.number().int().positive().optional(),
  isEssential: z.boolean().optional(),
  isPacked: z.boolean().optional()
});

const bulkPackingUpdateSchema = z.object({
  items: z.array(
    z.object({
      itemId: idSchema,
      isPacked: z.boolean()
    })
  ).min(1, { message: 'At least one item is required for bulk update' })
});

const travelDocTypeEnum = z.enum([
  'PASSPORT',
  'VISA',
  'FLIGHT_TICKET',
  'HOTEL_BOOKING',
  'TRAVEL_INSURANCE',
  'IDENTIFICATION',
  'OTHER'
]);

const createTravelDocumentSchema = z.object({
  name: z.string().min(2, { message: 'Document name must be at least 2 characters' }).max(100),
  type: travelDocTypeEnum.optional().default('OTHER'),
  isRequired: z.boolean().optional().default(true),
  isReady: z.boolean().optional().default(false),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'expiryDate must be in YYYY-MM-DD format' }).optional().nullable(),
  notes: z.string().max(500).optional()
});

const updateTravelDocumentSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  type: travelDocTypeEnum.optional(),
  isRequired: z.boolean().optional(),
  isReady: z.boolean().optional(),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  notes: z.string().max(500).optional()
});

const taskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

const createPreparationTaskSchema = z.object({
  title: z.string().min(2, { message: 'Task title must be at least 2 characters' }).max(150),
  description: z.string().max(500).optional(),
  priority: taskPriorityEnum.optional().default('MEDIUM'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'dueDate must be in YYYY-MM-DD format' }).optional().nullable(),
  isCompleted: z.boolean().optional().default(false)
});

const updatePreparationTaskSchema = z.object({
  title: z.string().min(2).max(150).optional(),
  description: z.string().max(500).optional(),
  priority: taskPriorityEnum.optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  isCompleted: z.boolean().optional()
});

module.exports = {
  createPackingItemSchema,
  updatePackingItemSchema,
  bulkPackingUpdateSchema,
  createTravelDocumentSchema,
  updateTravelDocumentSchema,
  createPreparationTaskSchema,
  updatePreparationTaskSchema
};
