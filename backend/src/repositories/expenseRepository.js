const mockDb = require('./mockDatabase');

class ExpenseRepository {
  async findById(id) {
    const numId = Number(id);
    const item = mockDb.expenses.find(e => e.id === numId);
    return item ? { ...item } : null;
  }

  async findByTripId(tripId, { category, sectionId, dayId } = {}) {
    const numTripId = Number(tripId);
    let result = mockDb.expenses.filter(e => e.tripId === numTripId);

    if (category) {
      result = result.filter(e => e.category.toUpperCase() === category.toUpperCase());
    }

    if (sectionId) {
      result = result.filter(e => e.sectionId === Number(sectionId));
    }

    if (dayId) {
      result = result.filter(e => e.dayId === Number(dayId));
    }

    return result.sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => ({ ...e }));
  }

  async create(data) {
    const id = mockDb.getNextId('expenses');
    const now = new Date().toISOString();

    const newExpense = {
      id,
      tripId: Number(data.tripId),
      sectionId: data.sectionId ? Number(data.sectionId) : null,
      dayId: data.dayId ? Number(data.dayId) : null,
      category: data.category.toUpperCase(),
      amount: Number(data.amount),
      description: data.description || '',
      date: data.date || new Date().toISOString().split('T')[0],
      createdAt: now
    };

    mockDb.expenses.push(newExpense);
    return { ...newExpense };
  }

  async update(id, updateData) {
    const numId = Number(id);
    const index = mockDb.expenses.findIndex(e => e.id === numId);
    if (index === -1) return null;

    const existing = mockDb.expenses[index];
    const updated = {
      ...existing,
      ...updateData,
      id: existing.id,
      tripId: existing.tripId,
      amount: updateData.amount !== undefined ? Number(updateData.amount) : existing.amount,
      category: updateData.category ? updateData.category.toUpperCase() : existing.category
    };

    mockDb.expenses[index] = updated;
    return { ...updated };
  }

  async delete(id) {
    const numId = Number(id);
    const index = mockDb.expenses.findIndex(e => e.id === numId);
    if (index === -1) return false;

    mockDb.expenses.splice(index, 1);
    return true;
  }

  async deleteByTripId(tripId) {
    const numTripId = Number(tripId);
    mockDb.expenses = mockDb.expenses.filter(e => e.tripId !== numTripId);
    return true;
  }

  async count() {
    return mockDb.expenses.length;
  }

  async totalAmount() {
    return mockDb.expenses.reduce((sum, e) => sum + e.amount, 0);
  }
}

module.exports = new ExpenseRepository();
