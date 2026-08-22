const mockDb = require('./mockDatabase');
const { parsePagination } = require('../utils/pagination');
const { parseSort } = require('../utils/sortHelper');

class CommunityRepository {
  async findAll(query = {}) {
    let result = [...mockDb.communityPosts];

    if (query.userId) {
      result = result.filter(p => p.userId === Number(query.userId));
    }

    if (query.tripId) {
      result = result.filter(p => p.tripId === Number(query.tripId));
    }

    if (query.search) {
      const q = query.search.toLowerCase().trim();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
      );
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'title'];
    const { sortBy, order } = parseSort(query.sortBy || (query.sort === 'oldest' ? 'createdAt' : undefined), query.order || (query.sort === 'oldest' ? 'asc' : undefined), allowedSortFields, 'createdAt', 'desc');

    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        return order === 'asc' ? new Date(valA) - new Date(valB) : new Date(valB) - new Date(valA);
      }
      return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    const total = result.length;
    const { page, limit, offset } = parsePagination(query);
    const paginated = result.slice(offset, offset + limit);

    return {
      posts: paginated.map(p => ({ ...p })),
      total,
      page,
      limit
    };
  }

  async findById(id) {
    const numId = Number(id);
    const post = mockDb.communityPosts.find(p => p.id === numId);
    return post ? { ...post } : null;
  }

  async create(data) {
    const id = mockDb.getNextId('communityPosts');
    const now = new Date().toISOString();

    const newPost = {
      id,
      userId: Number(data.userId),
      tripId: data.tripId ? Number(data.tripId) : null,
      title: data.title.trim(),
      content: data.content.trim(),
      imageUrl: data.imageUrl || null,
      createdAt: now,
      updatedAt: now
    };

    mockDb.communityPosts.push(newPost);
    return { ...newPost };
  }

  async update(id, updateData) {
    const numId = Number(id);
    const index = mockDb.communityPosts.findIndex(p => p.id === numId);
    if (index === -1) return null;

    const existing = mockDb.communityPosts[index];
    const updated = {
      ...existing,
      ...updateData,
      id: existing.id,
      userId: existing.userId,
      updatedAt: new Date().toISOString()
    };

    mockDb.communityPosts[index] = updated;
    return { ...updated };
  }

  async delete(id) {
    const numId = Number(id);
    const index = mockDb.communityPosts.findIndex(p => p.id === numId);
    if (index === -1) return false;

    mockDb.communityPosts.splice(index, 1);
    return true;
  }

  async count() {
    return mockDb.communityPosts.length;
  }
}

module.exports = new CommunityRepository();
