const db = require('../config/database');
const { mapRowToEntity, mapRowsToEntities } = require('../utils/dbHelper');

class SettlementRepository {
  async create(data) {
    const res = await db.query(
      `INSERT INTO public.settlements (
        trip_id,
        from_user_id,
        to_user_id,
        amount,
        status,
        notes,
        settled_at
      ) VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, now())
      RETURNING *;`,
      [
        data.tripId,
        data.fromUserId,
        data.toUserId,
        Number(data.amount || 0),
        (data.status || 'COMPLETED').toUpperCase(),
        data.notes || null
      ]
    );

    return this.findById(res.rows[0].id);
  }

  async findById(id) {
    if (!id) return null;
    const res = await db.query(
      `SELECT s.*,
              f.first_name AS from_first_name, f.last_name AS from_last_name,
              t.first_name AS to_first_name, t.last_name AS to_last_name
       FROM public.settlements s
       LEFT JOIN public.profiles f ON f.id = s.from_user_id
       LEFT JOIN public.profiles t ON t.id = s.to_user_id
       WHERE s.id::text = $1::text;`,
      [String(id)]
    );
    if (!res.rows[0]) return null;
    const item = mapRowToEntity(res.rows[0]);
    if (res.rows[0].from_first_name) {
      item.fromUser = {
        id: item.fromUserId,
        name: `${res.rows[0].from_first_name} ${res.rows[0].from_last_name || ''}`.trim()
      };
    }
    if (res.rows[0].to_first_name) {
      item.toUser = {
        id: item.toUserId,
        name: `${res.rows[0].to_first_name} ${res.rows[0].to_last_name || ''}`.trim()
      };
    }
    return item;
  }

  async findByTripId(tripId) {
    if (!tripId) return [];
    const res = await db.query(
      `SELECT s.*,
              f.first_name AS from_first_name, f.last_name AS from_last_name,
              t.first_name AS to_first_name, t.last_name AS to_last_name
       FROM public.settlements s
       LEFT JOIN public.profiles f ON f.id = s.from_user_id
       LEFT JOIN public.profiles t ON t.id = s.to_user_id
       WHERE s.trip_id::text = $1::text
       ORDER BY s.created_at DESC;`,
      [String(tripId)]
    );
    const list = mapRowsToEntities(res.rows).map(item => {
      if (item.fromFirstName) {
        item.fromUser = {
          id: item.fromUserId,
          name: `${item.fromFirstName} ${item.fromLastName || ''}`.trim()
        };
      }
      if (item.toFirstName) {
        item.toUser = {
          id: item.toUserId,
          name: `${item.toFirstName} ${item.toLastName || ''}`.trim()
        };
      }
      return item;
    });

    list.settlements = list;
    list.total = list.length;
    list.page = 1;
    list.limit = list.length;

    return list;
  }

  async updateStatus(id, status) {
    const res = await db.query(
      `UPDATE public.settlements
       SET status = $1
       WHERE id::text = $2::text
       RETURNING *;`,
      [status.toUpperCase(), String(id)]
    );
    if (!res.rows[0]) return null;
    return this.findById(id);
  }

  async findAllByTripId(tripId) {
    return this.findByTripId(tripId);
  }

  async deleteByTripId(tripId) {
    if (!tripId) return 0;
    const res = await db.query(
      `DELETE FROM public.settlements WHERE trip_id::text = $1::text;`,
      [String(tripId)]
    );
    return res.rowCount;
  }
}

module.exports = new SettlementRepository();
