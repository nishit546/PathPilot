const db = require('../config/database');
const { mapRowToEntity } = require('../utils/dbHelper');

class SharedTripRepository {
  async create(data) {
    const res = await db.query(
      `INSERT INTO public.shared_trips (
        trip_id,
        shared_by,
        share_token,
        is_public,
        expires_at
      ) VALUES ($1::uuid, $2::uuid, $3, $4, $5)
      RETURNING *;`,
      [
        data.tripId,
        data.userId || data.sharedBy,
        data.shareToken || data.shareId,
        data.isPublic !== undefined ? Boolean(data.isPublic) : true,
        data.expiresAt || null
      ]
    );

    return mapRowToEntity(res.rows[0]);
  }

  async findByTripId(tripId) {
    if (!tripId) return null;
    const res = await db.query(
      `SELECT * FROM public.shared_trips WHERE trip_id::text = $1::text ORDER BY created_at DESC LIMIT 1;`,
      [String(tripId)]
    );
    if (!res.rows[0]) return null;
    return mapRowToEntity(res.rows[0]);
  }

  async findByToken(token) {
    if (!token) return null;
    const res = await db.query(
      `SELECT * FROM public.shared_trips WHERE share_token = $1;`,
      [token]
    );
    if (!res.rows[0]) return null;
    return mapRowToEntity(res.rows[0]);
  }

  async deleteByTripId(tripId) {
    if (!tripId) return 0;
    const res = await db.query(
      `DELETE FROM public.shared_trips WHERE trip_id::text = $1::text;`,
      [String(tripId)]
    );
    return res.rowCount;
  }

  async delete(id) {
    if (!id) return false;
    const res = await db.query(
      `DELETE FROM public.shared_trips WHERE id::text = $1::text RETURNING id;`,
      [String(id)]
    );
    return res.rowCount > 0;
  }
}

module.exports = new SharedTripRepository();
