const mockDb = require('./mockDatabase');
const { parsePagination } = require('../utils/pagination');
const { parseSort } = require('../utils/sortHelper');

class ActivityRepository {
  async findAll(query = {}) {
    let result = [...mockDb.activities];

    if (query.cityId) {
      const numCityId = Number(query.cityId);
      result = result.filter(a => a.cityId === numCityId);
    }

    if (query.category) {
      result = result.filter(a => a.category.toUpperCase() === query.category.toUpperCase().trim());
    }

    if (query.minCost !== undefined && query.minCost !== null && query.minCost !== '') {
      const min = Number(query.minCost);
      if (!isNaN(min)) {
        result = result.filter(a => a.estimatedCost >= min);
      }
    }

    if (query.maxCost !== undefined && query.maxCost !== null && query.maxCost !== '') {
      const max = Number(query.maxCost);
      if (!isNaN(max)) {
        result = result.filter(a => a.estimatedCost <= max);
      }
    }

    if (query.search) {
      const q = query.search.toLowerCase().trim();
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q))
      );
    }

    const allowedSortFields = ['popularity', 'estimatedCost', 'duration', 'name'];
    const { sortBy, order } = parseSort(query.sortBy, query.order, allowedSortFields, 'popularity', 'desc');

    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (typeof valA === 'string') {
        return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return order === 'asc' ? valA - valB : valB - valA;
    });

    const total = result.length;
    const { page, limit, offset } = parsePagination(query);
    const paginated = result.slice(offset, offset + limit);

    return {
      activities: paginated.map(a => ({ ...a })),
      total,
      page,
      limit
    };
  }

  async findById(id) {
    const numId = Number(id);
    const activity = mockDb.activities.find(a => a.id === numId);
    return activity ? { ...activity } : null;
  }

  async findByCityId(cityId) {
    const numCityId = Number(cityId);
    return mockDb.activities.filter(a => a.cityId === numCityId).map(a => ({ ...a }));
  }

  async count() {
    return mockDb.activities.length;
  }
}

module.exports = new ActivityRepository();
