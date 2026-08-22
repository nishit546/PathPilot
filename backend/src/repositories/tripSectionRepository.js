const mockDb = require('./mockDatabase');

class TripSectionRepository {
  async findById(id) {
    const numId = Number(id);
    const section = mockDb.tripSections.find(s => s.id === numId);
    return section ? { ...section } : null;
  }

  async findByTripId(tripId) {
    const numTripId = Number(tripId);
    const sections = mockDb.tripSections.filter(s => s.tripId === numTripId);
    return sections.sort((a, b) => a.order - b.order).map(s => ({ ...s }));
  }

  async create(data) {
    const id = mockDb.getNextId('tripSections');
    const now = new Date().toISOString();

    const existingSections = mockDb.tripSections.filter(s => s.tripId === Number(data.tripId));
    const nextOrder = data.order !== undefined ? Number(data.order) : existingSections.length + 1;

    const newSection = {
      id,
      tripId: Number(data.tripId),
      cityId: Number(data.cityId),
      startDate: data.startDate,
      endDate: data.endDate,
      budget: Number(data.budget) || 0,
      order: nextOrder,
      createdAt: now,
      updatedAt: now
    };

    mockDb.tripSections.push(newSection);
    return { ...newSection };
  }

  async update(id, updateData) {
    const numId = Number(id);
    const index = mockDb.tripSections.findIndex(s => s.id === numId);
    if (index === -1) return null;

    const existing = mockDb.tripSections[index];
    const updated = {
      ...existing,
      ...updateData,
      id: existing.id,
      tripId: existing.tripId,
      cityId: updateData.cityId !== undefined ? Number(updateData.cityId) : existing.cityId,
      budget: updateData.budget !== undefined ? Number(updateData.budget) : existing.budget,
      order: updateData.order !== undefined ? Number(updateData.order) : existing.order,
      updatedAt: new Date().toISOString()
    };

    mockDb.tripSections[index] = updated;
    return { ...updated };
  }

  async delete(id) {
    const numId = Number(id);
    const index = mockDb.tripSections.findIndex(s => s.id === numId);
    if (index === -1) return false;

    mockDb.tripSections.splice(index, 1);
    return true;
  }

  async deleteByTripId(tripId) {
    const numTripId = Number(tripId);
    mockDb.tripSections = mockDb.tripSections.filter(s => s.tripId !== numTripId);
    return true;
  }

  async reorder(tripId, orderedIds) {
    const numTripId = Number(tripId);
    orderedIds.forEach((id, index) => {
      const section = mockDb.tripSections.find(s => s.id === Number(id) && s.tripId === numTripId);
      if (section) {
        section.order = index + 1;
        section.updatedAt = new Date().toISOString();
      }
    });

    return this.findByTripId(tripId);
  }
}

module.exports = new TripSectionRepository();
