const ApiError = require('../utils/ApiError');

/**
 * Higher-order middleware to validate request payload using a Zod schema.
 * @param {import('zod').ZodSchema} schema
 * @param {'body' | 'query' | 'params'} [source='body']
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const parsed = schema.parse(req[source]);
    req[source] = parsed;
    next();
  } catch (error) {
    const errorDetails = error.errors?.map((err) => ({
      field: err.path.join('.'),
      message: err.message
    })) || [{ message: error.message }];

    next(new ApiError(400, 'Validation failed', errorDetails));
  }
};

module.exports = { validate };
