const db = require('../config/database');
const { mapRowToEntity, mapRowsToEntities } = require('../utils/dbHelper');

class PackingRepository {
  async create(data) {
    const res = await db.query(
      `INSERT INTO public.packing_items (
        trip_id,
        user_id,
        name,
        category,
        quantity,
        is_packed,
        is_essential,
        notes
      ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;`,
      [
        data.tripId,
        data.userId || data.createdBy || null,
        data.name.trim(),
        (data.category || 'ESSENTIALS').toUpperCase(),
        Number(data.quantity || 1),
        Boolean(data.isPacked),
        Boolean(data.isEssential),
        data.notes || null
      ]
    );

    return mapRowToEntity(res.rows[0]);
  }

  async createItem(data) {
    return this.create(data);
  }

  async findById(id) {
    if (!id) return null;
    const res = await db.query(
      `SELECT * FROM public.packing_items WHERE id::text = $1::text;`,
      [String(id)]
    );
    if (!res.rows[0]) return null;
    return mapRowToEntity(res.rows[0]);
  }

  async findItemById(id) {
    return this.findById(id);
  }

  async findByNameAndTrip(tripId, name) {
    if (!tripId || !name) return null;
    const res = await db.query(
      `SELECT * FROM public.packing_items
       WHERE trip_id::text = $1::text AND LOWER(name) = LOWER($2);`,
      [String(tripId), name.trim()]
    );
    if (!res.rows[0]) return null;
    return mapRowToEntity(res.rows[0]);
  }

  async findByTripId(tripId, query = {}) {
    const params = [String(tripId)];
    const conditions = [`trip_id::text = $1::text`];

    if (query.category) {
      params.push(query.category.toUpperCase());
      conditions.push(`category = $${params.length}`);
    }

    if (query.isPacked !== undefined && query.isPacked !== null && query.isPacked !== '') {
      params.push(String(query.isPacked) === 'true');
      conditions.push(`is_packed = $${params.length}`);
    }

    if (query.userId) {
      params.push(String(query.userId));
      conditions.push(`(user_id::text = $${params.length}::text OR user_id IS NULL)`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const res = await db.query(
      `SELECT * FROM public.packing_items ${whereClause} ORDER BY is_packed ASC, is_essential DESC, created_at ASC;`,
      params
    );
    return mapRowsToEntities(res.rows);
  }

  async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates = [];
    const params = [];

    if (data.name !== undefined) {
      params.push(data.name.trim());
      updates.push(`name = $${params.length}`);
    }
    if (data.category !== undefined) {
      params.push(data.category.toUpperCase());
      updates.push(`category = $${params.length}`);
    }
    if (data.quantity !== undefined) {
      params.push(Number(data.quantity));
      updates.push(`quantity = $${params.length}`);
    }
    if (data.isPacked !== undefined) {
      params.push(Boolean(data.isPacked));
      updates.push(`is_packed = $${params.length}`);
    }
    if (data.isEssential !== undefined) {
      params.push(Boolean(data.isEssential));
      updates.push(`is_essential = $${params.length}`);
    }
    if (data.notes !== undefined) {
      params.push(data.notes);
      updates.push(`notes = $${params.length}`);
    }

    if (updates.length === 0) return existing;

    updates.push(`updated_at = now()`);
    params.push(String(id));

    const res = await db.query(
      `UPDATE public.packing_items
       SET ${updates.join(', ')}
       WHERE id::text = $${params.length}::text
       RETURNING *;`,
      params
    );

    return mapRowToEntity(res.rows[0]);
  }

  async updateItem(id, data) {
    return this.update(id, data);
  }

  async delete(id) {
    if (!id) return false;
    const res = await db.query(
      `DELETE FROM public.packing_items WHERE id::text = $1::text RETURNING id;`,
      [String(id)]
    );
    return res.rowCount > 0;
  }

  async deleteItem(id) {
    return this.delete(id);
  }

  async bulkUpdateStatus(ids, isPacked) {
    if (!ids || ids.length === 0) return 0;
    const strIds = ids.map(String);
    const res = await db.query(
      `UPDATE public.packing_items
       SET is_packed = $1, updated_at = now()
       WHERE id::text = ANY($2::text[]);`,
      [Boolean(isPacked), strIds]
    );
    return res.rowCount;
  }

  async bulkUpdatePackedStatus(tripId, items) {
    if (!Array.isArray(items) || items.length === 0) return [];
    for (const item of items) {
      const id = item.id || item.itemId;
      if (id && item.isPacked !== undefined) {
        await this.update(id, { isPacked: item.isPacked });
      }
    }
    return this.findByTripId(tripId);
  }

  async deleteByTripId(tripId) {
    if (!tripId) return 0;
    const res = await db.query(
      `DELETE FROM public.packing_items WHERE trip_id::text = $1::text;`,
      [String(tripId)]
    );
    return res.rowCount;
  }
}

module.exports = new PackingRepository();
