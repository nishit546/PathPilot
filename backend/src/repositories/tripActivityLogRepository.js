const db = require('../config/database');
const { mapRowToEntity, mapRowsToEntities } = require('../utils/dbHelper');

class TripActivityLogRepository {
  async create(data) {
    const res = await db.query(
      `INSERT INTO public.activity_logs (
        trip_id,
        user_id,
        action,
        description,
        metadata
      ) VALUES ($1::uuid, $2, $3, $4, $5::jsonb)
      RETURNING *;`,
      [
        data.tripId,
        data.userId ? String(data.userId) : null,
        data.action,
        data.description,
        JSON.stringify(data.metadata || {})
      ]
    );

    return mapRowToEntity(res.rows[0]);
  }

  async findByTripId(tripId) {
    if (!tripId) return [];
    const res = await db.query(
      `SELECT al.*, p.first_name, p.last_name, p.email
       FROM public.activity_logs al
       LEFT JOIN public.profiles p ON p.id = al.user_id
       WHERE al.trip_id::text = $1::text
       ORDER BY al.created_at DESC;`,
      [String(tripId)]
    );
    return mapRowsToEntities(res.rows).map(item => {
      if (item.userId && item.firstName) {
        item.user = {
          id: item.userId,
          name: `${item.firstName} ${item.lastName || ''}`.trim()
        };
      }
      return item;
    });
  }

  async deleteByTripId(tripId) {
    if (!tripId) return 0;
    const res = await db.query(
      `DELETE FROM public.activity_logs WHERE trip_id::text = $1::text;`,
      [String(tripId)]
    );
    return res.rowCount;
  }
}

module.exports = new TripActivityLogRepository();
