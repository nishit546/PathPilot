const mockDb = require('./mockDatabase');

class SharedTripRepository {
  async findByToken(shareToken) {
    if (!shareToken) return null;
    const item = mockDb.sharedTrips.find(s => s.shareToken === shareToken);
    return item ? { ...item } : null;
  }

  async findByTripId(tripId) {
    const numTripId = Number(tripId);
    const item = mockDb.sharedTrips.find(s => s.tripId === numTripId);
    return item ? { ...item } : null;
  }

  async create(tripId, shareToken) {
    const numTripId = Number(tripId);
    // Remove existing share if present
    this.deleteByTripId(numTripId);

    const id = mockDb.getNextId('sharedTrips');
    const now = new Date().toISOString();

    const newShare = {
      id,
      tripId: numTripId,
      shareToken,
      createdAt: now
    };

    mockDb.sharedTrips.push(newShare);
    return { ...newShare };
  }

  async deleteByTripId(tripId) {
    const numTripId = Number(tripId);
    const index = mockDb.sharedTrips.findIndex(s => s.tripId === numTripId);
    if (index === -1) return false;

    mockDb.sharedTrips.splice(index, 1);
    return true;
  }

  async deleteByToken(shareToken) {
    const index = mockDb.sharedTrips.findIndex(s => s.shareToken === shareToken);
    if (index === -1) return false;

    mockDb.sharedTrips.splice(index, 1);
    return true;
  }
}

module.exports = new SharedTripRepository();
