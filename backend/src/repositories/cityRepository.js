const mockDb = require('./mockDatabase');
const { parsePagination } = require('../utils/pagination');
const { parseSort } = require('../utils/sortHelper');

class CityRepository {
  async findAll(query = {}) {
    let result = [...mockDb.cities];

    if (query.search) {
      const q = query.search.toLowerCase().trim();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    }

    if (query.country) {
      result = result.filter(c => c.country.toLowerCase() === query.country.toLowerCase().trim());
    }

    if (query.region) {
      result = result.filter(c => c.region.toLowerCase() === query.region.toLowerCase().trim());
    }

    if (query.minPopularity !== undefined && query.minPopularity !== null && query.minPopularity !== '') {
      const min = Number(query.minPopularity);
      if (!isNaN(min)) {
        result = result.filter(c => c.popularity >= min);
      }
    }

    const allowedSortFields = ['popularity', 'costIndex', 'name', 'country', 'region'];
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
      cities: paginated.map(c => ({ ...c })),
      total,
      page,
      limit
    };
  }

  async findById(id) {
    const numId = Number(id);
    const city = mockDb.cities.find(c => c.id === numId);
    return city ? { ...city } : null;
  }

  async findByName(name) {
    if (!name) return null;
    const city = mockDb.cities.find(c => c.name.toLowerCase() === name.toLowerCase().trim());
    return city ? { ...city } : null;
  }

  async count() {
    return mockDb.cities.length;
  }
}

module.exports = new CityRepository();
