/**
 * Standard pagination helper utility for PathPilot.
 */

/**
 * Parse pagination query parameters safely.
 * @param {object} query - Express req.query
 * @param {number} [defaultLimit=10]
 * @param {number} [maxLimit=50]
 * @returns {{ page: number, limit: number, offset: number }}
 */
const parsePagination = (query = {}, defaultLimit = 10, maxLimit = 50) => {
  let page = parseInt(query.page, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  let limit = parseInt(query.limit, 10);
  if (isNaN(limit) || limit < 1) {
    limit = defaultLimit;
  } else if (limit > maxLimit) {
    limit = maxLimit;
  }

  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset
  };
};

/**
 * Build pagination metadata object.
 * @param {number} totalItems
 * @param {number} page
 * @param {number} limit
 * @returns {{ page: number, limit: number, totalItems: number, totalPages: number, hasNextPage: boolean, hasPreviousPage: boolean }}
 */
const buildPaginationMetadata = (totalItems, page, limit) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
};

module.exports = {
  parsePagination,
  buildPaginationMetadata
};
