const { z } = require('zod');

const idSchema = z.union([z.string().min(1), z.number()]);

const reorderCitySchema = z.object({
  cityOrder: z.array(idSchema).min(1, { message: 'cityOrder must contain at least 1 section ID' }).optional(),
  sectionOrder: z.array(idSchema).min(1, { message: 'sectionOrder must contain at least 1 section ID' }).optional()
}).refine((data) => data.cityOrder || data.sectionOrder, {
  message: 'Either cityOrder or sectionOrder must be provided'
});

const applyOptimizationSchema = z.object({
  sectionOrder: z.array(idSchema).min(1, { message: 'sectionOrder must contain at least 1 section ID' })
});

const selectTransportSchema = z.object({
  selectedMode: z.enum(['FLIGHT', 'TRAIN', 'BUS', 'CAR', 'flight', 'train', 'bus', 'car'], {
    errorMap: () => ({ message: 'selectedMode must be one of FLIGHT, TRAIN, BUS, CAR' })
  })
});

const applyDayOptimizationSchema = z.object({
  activityOrder: z.array(z.union([
    idSchema,
    z.object({
      id: idSchema,
      suggestedStartTime: z.string().optional(),
      suggestedEndTime: z.string().optional()
    })
  ])).optional()
});

module.exports = {
  reorderCitySchema,
  applyOptimizationSchema,
  selectTransportSchema,
  applyDayOptimizationSchema
};
