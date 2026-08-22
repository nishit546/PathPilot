const mockDb = require('./mockDatabase');

class DayRepository {
  async findById(id) {
    const numId = Number(id);
    const day = mockDb.days.find(d => d.id === numId);
    return day ? { ...day } : null;
  }

  async findBySectionId(sectionId) {
    const numSectionId = Number(sectionId);
    const days = mockDb.days.filter(d => d.sectionId === numSectionId);
    return days.sort((a, b) => a.dayNumber - b.dayNumber).map(d => ({ ...d }));
  }

  async findByTripId(tripId) {
    const numTripId = Number(tripId);
    const days = mockDb.days.filter(d => d.tripId === numTripId);
    return days.sort((a, b) => new Date(a.date) - new Date(b.date)).map(d => ({ ...d }));
  }

  async create(data) {
    const id = mockDb.getNextId('days');
    const newDay = {
      id,
      sectionId: Number(data.sectionId),
      tripId: Number(data.tripId),
      date: data.date,
      dayNumber: Number(data.dayNumber)
    };

    mockDb.days.push(newDay);
    return { ...newDay };
  }

  async createBulk(daysArray) {
    const created = [];
    for (const d of daysArray) {
      const day = await this.create(d);
      created.push(day);
    }
    return created;
  }

  async delete(id) {
    const numId = Number(id);
    const index = mockDb.days.findIndex(d => d.id === numId);
    if (index === -1) return false;

    mockDb.days.splice(index, 1);
    return true;
  }

  async deleteBySectionId(sectionId) {
    const numSectionId = Number(sectionId);
    mockDb.days = mockDb.days.filter(d => d.sectionId !== numSectionId);
    return true;
  }

  async deleteByTripId(tripId) {
    const numTripId = Number(tripId);
    mockDb.days = mockDb.days.filter(d => d.tripId !== numTripId);
    return true;
  }
}

module.exports = new DayRepository();
