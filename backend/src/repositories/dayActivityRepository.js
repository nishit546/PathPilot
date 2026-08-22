const mockDb = require('./mockDatabase');

class DayActivityRepository {
  async findById(id) {
    const numId = Number(id);
    const item = mockDb.dayActivities.find(da => da.id === numId);
    return item ? { ...item } : null;
  }

  async findByDayId(dayId) {
    const numDayId = Number(dayId);
    const items = mockDb.dayActivities.filter(da => da.dayId === numDayId);
    return items.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return (a.startTime || '').localeCompare(b.startTime || '');
    }).map(da => ({ ...da }));
  }

  async findByDayIds(dayIds) {
    const ids = dayIds.map(Number);
    const items = mockDb.dayActivities.filter(da => ids.includes(da.dayId));
    return items.map(da => ({ ...da }));
  }

  async create(data) {
    const id = mockDb.getNextId('dayActivities');
    const now = new Date().toISOString();

    const existingForDay = mockDb.dayActivities.filter(da => da.dayId === Number(data.dayId));
    const nextOrder = data.order !== undefined ? Number(data.order) : existingForDay.length + 1;

    const newItem = {
      id,
      dayId: Number(data.dayId),
      activityId: Number(data.activityId),
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      customCost: data.customCost !== undefined && data.customCost !== null ? Number(data.customCost) : null,
      notes: data.notes || '',
      order: nextOrder,
      createdAt: now
    };

    mockDb.dayActivities.push(newItem);
    return { ...newItem };
  }

  async update(id, updateData) {
    const numId = Number(id);
    const index = mockDb.dayActivities.findIndex(da => da.id === numId);
    if (index === -1) return null;

    const existing = mockDb.dayActivities[index];
    const updated = {
      ...existing,
      ...updateData,
      id: existing.id,
      dayId: existing.dayId,
      activityId: updateData.activityId !== undefined ? Number(updateData.activityId) : existing.activityId,
      customCost: updateData.customCost !== undefined ? (updateData.customCost !== null ? Number(updateData.customCost) : null) : existing.customCost,
      order: updateData.order !== undefined ? Number(updateData.order) : existing.order
    };

    mockDb.dayActivities[index] = updated;
    return { ...updated };
  }

  async delete(id) {
    const numId = Number(id);
    const index = mockDb.dayActivities.findIndex(da => da.id === numId);
    if (index === -1) return false;

    mockDb.dayActivities.splice(index, 1);
    return true;
  }

  async deleteByDayId(dayId) {
    const numDayId = Number(dayId);
    mockDb.dayActivities = mockDb.dayActivities.filter(da => da.dayId !== numDayId);
    return true;
  }

  async reorder(dayId, orderedIds) {
    const numDayId = Number(dayId);
    orderedIds.forEach((id, index) => {
      const item = mockDb.dayActivities.find(da => da.id === Number(id) && da.dayId === numDayId);
      if (item) {
        item.order = index + 1;
      }
    });

    return this.findByDayId(dayId);
  }
}

module.exports = new DayActivityRepository();
