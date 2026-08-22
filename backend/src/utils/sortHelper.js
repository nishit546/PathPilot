/**
 * Safe sorting parser with allowlist protection.
 */

/**
 * Parses and validates sort parameters.
 * @param {string} [sortBy]
 * @param {string} [order]
 * @param {string[]} allowedFields
 * @param {string} defaultField
 * @param {'asc' | 'desc'} [defaultOrder='desc']
 * @returns {{ sortBy: string, order: 'asc' | 'desc' }}
 */
const parseSort = (sortBy, order, allowedFields = [], defaultField = 'createdAt', defaultOrder = 'desc') => {
  let safeSortBy = defaultField;
  if (sortBy && allowedFields.includes(sortBy)) {
    safeSortBy = sortBy;
  }

  let safeOrder = defaultOrder.toLowerCase();
  if (order && (order.toLowerCase() === 'asc' || order.toLowerCase() === 'desc')) {
    safeOrder = order.toLowerCase();
  }

  return {
    sortBy: safeSortBy,
    order: safeOrder
  };
};

module.exports = {
  parseSort
};
