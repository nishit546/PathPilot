const cityService = require('../services/cityService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { buildPaginationMetadata } = require('../utils/pagination');

const getCities = asyncHandler(async (req, res) => {
  const result = await cityService.getAllCities(req.query);
  const paginationMeta = buildPaginationMetadata(result.total, result.page, result.limit);
  return sendPaginated(res, 'Cities retrieved successfully', result.cities, paginationMeta, 200);
});

const getCityById = asyncHandler(async (req, res) => {
  const city = await cityService.getCityById(req.params.id);
  return sendSuccess(res, 'City details retrieved successfully', { city }, 200);
});

module.exports = {
  getCities,
  getCityById
};
