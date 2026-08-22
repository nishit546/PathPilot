const db = require('../config/database');
const { mapRowToEntity, mapRowsToEntities } = require('../utils/dbHelper');
const { parsePagination } = require('../utils/pagination');

class NotificationRepository {
  async create(data) {
    const dataObj = {
      ...(data.data || {}),
      ...(data.metadata || {}),
      relatedTripId: data.relatedTripId || (data.data && data.data.relatedTripId) || null,
      relatedUserId: data.relatedUserId || (data.data && data.data.relatedUserId) || null
    };

    const res = await db.query(
      `INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        is_read,
        data
      ) VALUES ($1::uuid, $2, $3, $4, $5, $6::jsonb)
      RETURNING *;`,
      [
        data.userId,
        data.type,
        data.title,
        data.message,
        Boolean(data.isRead),
        JSON.stringify(dataObj)
      ]
    );

    return mapRowToEntity(res.rows[0]);
  }

  async findExistingSimilarNotification(userId, tripId, type) {
    if (!userId || !type) return null;
    const res = await db.query(
      `SELECT * FROM public.notifications
       WHERE user_id::text = $1::text
         AND type = $2
         AND (data->>'relatedTripId')::text = $3::text
       ORDER BY created_at DESC LIMIT 1;`,
      [String(userId), type.toUpperCase(), String(tripId)]
    );
    if (!res.rows[0]) return null;
    return mapRowToEntity(res.rows[0]);
  }

  async findByUserId(userId, query = {}) {
    const params = [String(userId)];
    const conditions = [`user_id::text = $1::text`];

    if (query.isRead !== undefined && query.isRead !== null && query.isRead !== '') {
      params.push(String(query.isRead) === 'true');
      conditions.push(`is_read = $${params.length}`);
    }

    if (query.type) {
      params.push(query.type.toUpperCase());
      conditions.push(`type = $${params.length}`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countRes = await db.query(
      `SELECT COUNT(*) FROM public.notifications ${whereClause};`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const { page, limit, offset } = parsePagination(query);

    params.push(limit, offset);
    const sql = `
      SELECT *
      FROM public.notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length};
    `;

    const res = await db.query(sql, params);
    return {
      notifications: mapRowsToEntities(res.rows),
      total,
      page,
      limit
    };
  }

  async findByUser(userId, query = {}) {
    return this.findByUserId(userId, query);
  }

  async findById(id) {
    if (!id) return null;
    const res = await db.query(
      `SELECT * FROM public.notifications WHERE id::text = $1::text;`,
      [String(id)]
    );
    if (!res.rows[0]) return null;
    return mapRowToEntity(res.rows[0]);
  }

  async markAsRead(id) {
    const res = await db.query(
      `UPDATE public.notifications
       SET is_read = true
       WHERE id::text = $1::text
       RETURNING *;`,
      [String(id)]
    );
    if (!res.rows[0]) return null;
    return mapRowToEntity(res.rows[0]);
  }

  async markAllAsRead(userId) {
    const res = await db.query(
      `UPDATE public.notifications
       SET is_read = true
       WHERE user_id::text = $1::text AND is_read = false
       RETURNING *;`,
      [String(userId)]
    );
    return res.rowCount;
  }

  async delete(id) {
    if (!id) return false;
    const res = await db.query(
      `DELETE FROM public.notifications WHERE id::text = $1::text RETURNING id;`,
      [String(id)]
    );
    return res.rowCount > 0;
  }

  async deleteAll(userId) {
    if (!userId) return 0;
    const res = await db.query(
      `DELETE FROM public.notifications WHERE user_id::text = $1::text;`,
      [String(userId)]
    );
    return res.rowCount;
  }

  async countUnread(userId) {
    const res = await db.query(
      `SELECT COUNT(*) FROM public.notifications WHERE user_id::text = $1::text AND is_read = false;`,
      [String(userId)]
    );
    return parseInt(res.rows[0].count, 10);
  }

  async getUnreadCount(userId) {
    return this.countUnread(userId);
  }
}

module.exports = new NotificationRepository();
