const mockDb = require('./mockDatabase');
const { parsePagination } = require('../utils/pagination');
const { parseSort } = require('../utils/sortHelper');

class UserRepository {
  async findById(id) {
    const numId = Number(id);
    const user = mockDb.users.find(u => u.id === numId);
    return user ? { ...user } : null;
  }

  async findByEmail(email) {
    if (!email) return null;
    const user = mockDb.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    return user ? { ...user } : null;
  }

  async findAll(query = {}) {
    let result = [...mockDb.users];

    // Search
    if (query.search) {
      const q = query.search.toLowerCase().trim();
      result = result.filter(u =>
        u.email.toLowerCase().includes(q) ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q)
      );
    }

    // Role filter
    if (query.role) {
      result = result.filter(u => u.role === query.role.toUpperCase());
    }

    // Blocked filter
    if (query.isBlocked !== undefined && query.isBlocked !== null && query.isBlocked !== '') {
      const blockedBool = String(query.isBlocked) === 'true';
      result = result.filter(u => u.isBlocked === blockedBool);
    }

    // Sorting
    const allowedSortFields = ['createdAt', 'updatedAt', 'firstName', 'lastName', 'email', 'role'];
    const { sortBy, order } = parseSort(query.sortBy, query.order, allowedSortFields, 'createdAt', 'desc');

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
      users: paginated.map(u => {
        const { password, ...safeUser } = u;
        return safeUser;
      }),
      total,
      page,
      limit
    };
  }

  async create(userData) {
    const id = mockDb.getNextId('users');
    const now = new Date().toISOString();
    const newUser = {
      id,
      firstName: userData.firstName.trim(),
      lastName: userData.lastName.trim(),
      email: userData.email.toLowerCase().trim(),
      password: userData.password,
      phone: userData.phone ? userData.phone.trim() : null,
      city: userData.city ? userData.city.trim() : null,
      country: userData.country ? userData.country.trim() : null,
      additionalInfo: userData.additionalInfo ? userData.additionalInfo.trim() : null,
      profilePhoto: userData.profilePhoto || null,
      role: userData.role || 'USER',
      isBlocked: false,
      createdAt: now,
      updatedAt: now
    };

    mockDb.users.push(newUser);
    const { password, ...safeUser } = newUser;
    return safeUser;
  }

  async update(id, updateData) {
    const numId = Number(id);
    const index = mockDb.users.findIndex(u => u.id === numId);
    if (index === -1) return null;

    const existing = mockDb.users[index];
    const updated = {
      ...existing,
      ...updateData,
      id: existing.id,
      role: existing.role, // Do not allow direct unauthorized role mutation via profile
      updatedAt: new Date().toISOString()
    };

    // If explicit admin block/unblock
    if (updateData.isBlocked !== undefined) {
      updated.isBlocked = Boolean(updateData.isBlocked);
    }
    if (updateData.role !== undefined && updateData.allowRoleChange) {
      updated.role = updateData.role;
    }

    mockDb.users[index] = updated;
    const { password, ...safeUser } = updated;
    return safeUser;
  }

  async delete(id) {
    const numId = Number(id);
    const index = mockDb.users.findIndex(u => u.id === numId);
    if (index === -1) return false;

    mockDb.users.splice(index, 1);
    return true;
  }

  async count() {
    return mockDb.users.length;
  }
}

module.exports = new UserRepository();
