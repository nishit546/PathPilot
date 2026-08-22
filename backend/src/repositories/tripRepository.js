const mockDb = require('./mockDatabase');
const { parsePagination } = require('../utils/pagination');
const { parseSort } = require('../utils/sortHelper');

class TripRepository {
  async findById(id) {
    const numId = Number(id);
    const trip = mockDb.trips.find(t => t.id === numId);
    return trip ? { ...trip } : null;
  }

  async findByUserId(userId, query = {}) {
    const numUserId = Number(userId);
    let result = mockDb.trips.filter(t => t.userId === numUserId);

    // Search across name and description
    if (query.search) {
      const q = query.search.toLowerCase().trim();
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Visibility filter
    if (query.visibility) {
      result = result.filter(t => t.visibility === query.visibility.toUpperCase());
    }

    // Sorting allowlist
    const allowedSortFields = ['startDate', 'endDate', 'createdAt', 'updatedAt', 'name', 'totalBudget'];
    const { sortBy, order } = parseSort(query.sortBy, query.order, allowedSortFields, 'createdAt', 'desc');

    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'startDate' || sortBy === 'endDate' || sortBy === 'createdAt' || sortBy === 'updatedAt') {
        const timeA = new Date(valA).getTime();
        const timeB = new Date(valB).getTime();
        return order === 'asc' ? timeA - timeB : timeB - timeA;
      }

      if (typeof valA === 'string') {
        return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return order === 'asc' ? valA - valB : valB - valA;
    });

    const total = result.length;
    const { page, limit, offset } = parsePagination(query);
    const paginated = result.slice(offset, offset + limit);

    return {
      trips: paginated.map(t => ({ ...t })),
      total,
      page,
      limit
    };
  }

  async findPublicTrips(query = {}) {
    let result = mockDb.trips.filter(t => t.visibility === 'PUBLIC');

    if (query.search) {
      const q = query.search.toLowerCase().trim();
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    const allowedSortFields = ['startDate', 'endDate', 'createdAt', 'name', 'totalBudget'];
    const { sortBy, order } = parseSort(query.sortBy, query.order, allowedSortFields, 'createdAt', 'desc');

    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === 'startDate' || sortBy === 'endDate' || sortBy === 'createdAt') {
        return order === 'asc' ? new Date(valA) - new Date(valB) : new Date(valB) - new Date(valA);
      }
      if (typeof valA === 'string') {
        return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return order === 'asc' ? valA - valB : valB - valA;
    });

    const total = result.length;
    const { page, limit, offset } = parsePagination(query);
    const paginated = result.slice(offset, offset + limit);

    return {
      trips: paginated.map(t => ({ ...t })),
      total,
      page,
      limit
    };
  }

  async findAll() {
    return mockDb.trips.map(t => ({ ...t }));
  }

  async create(tripData) {
    const id = mockDb.getNextId('trips');
    const now = new Date().toISOString();
    const newTrip = {
      id,
      userId: Number(tripData.userId),
      name: tripData.name.trim(),
      description: tripData.description ? tripData.description.trim() : '',
      coverPhoto: tripData.coverPhoto || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      totalBudget: Number(tripData.totalBudget) || 0,
      visibility: tripData.visibility || 'PRIVATE',
      createdAt: now,
      updatedAt: now
    };

    mockDb.trips.push(newTrip);
    return { ...newTrip };
  }

  async update(id, updateData) {
    const numId = Number(id);
    const index = mockDb.trips.findIndex(t => t.id === numId);
    if (index === -1) return null;

    const existing = mockDb.trips[index];
    const updated = {
      ...existing,
      ...updateData,
      id: existing.id,
      userId: existing.userId,
      totalBudget: updateData.totalBudget !== undefined ? Number(updateData.totalBudget) : existing.totalBudget,
      updatedAt: new Date().toISOString()
    };

    mockDb.trips[index] = updated;
    return { ...updated };
  }

  async delete(id) {
    const numId = Number(id);
    const index = mockDb.trips.findIndex(t => t.id === numId);
    if (index === -1) return false;

    mockDb.trips.splice(index, 1);
    return true;
  }

  async count() {
    return mockDb.trips.length;
  }
}

module.exports = new TripRepository();
