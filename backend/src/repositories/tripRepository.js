const db = require('../config/database');
const { mapRowToEntity, mapRowsToEntities } = require('../utils/dbHelper');
const { parsePagination } = require('../utils/pagination');

class TripRepository {
  async findById(id) {
    if (!id) return null;
    const res = await db.query(
      `SELECT t.*, p.first_name AS owner_first_name, p.last_name AS owner_last_name, p.email AS owner_email
       FROM public.trips t
       LEFT JOIN public.profiles p ON p.id = t.user_id
       WHERE t.id::text = $1::text;`,
      [String(id)]
    );
    if (!res.rows[0]) return null;
    const item = mapRowToEntity(res.rows[0]);
    if (res.rows[0].owner_first_name || res.rows[0].owner_email) {
      item.user = {
        id: item.userId,
        name: `${res.rows[0].owner_first_name || ''} ${res.rows[0].owner_last_name || ''}`.trim() || 'User',
        email: res.rows[0].owner_email
      };
    }
    return item;
  }

  async findByUserId(userId, query = {}) {
    const params = [String(userId)];
    const conditions = [`(t.user_id::text = $1::text OR EXISTS (
      SELECT 1 FROM public.trip_collaborators tc WHERE tc.trip_id = t.id AND tc.user_id::text = $1::text
    ))`];

    if (query.search || query.q) {
      const qStr = (query.search || query.q).trim().toLowerCase();
      params.push(`%${qStr}%`);
      const pIdx = params.length;
      conditions.push(`(LOWER(t.title) LIKE $${pIdx} OR LOWER(COALESCE(t.description, '')) LIKE $${pIdx})`);
    }

    if (query.visibility) {
      params.push(query.visibility.toLowerCase());
      conditions.push(`LOWER(t.visibility) = $${params.length}`);
    }

    if (query.status) {
      params.push(query.status.toLowerCase());
      conditions.push(`LOWER(t.status) = $${params.length}`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countRes = await db.query(
      `SELECT COUNT(*) FROM public.trips t ${whereClause};`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const { page, limit, offset } = parsePagination(query);

    let orderBy = 't.created_at DESC';
    if (query.sortBy) {
      const order = (query.order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      if (query.sortBy.toLowerCase() === 'name' || query.sortBy.toLowerCase() === 'title') orderBy = `t.title ${order}`;
      if (query.sortBy.toLowerCase() === 'startdate' || query.sortBy.toLowerCase() === 'start_date') orderBy = `t.start_date ${order}`;
      if (query.sortBy.toLowerCase() === 'budget' || query.sortBy.toLowerCase() === 'totalbudget') orderBy = `t.overall_budget ${order}`;
    }

    params.push(limit, offset);
    const sql = `
      SELECT t.*
      FROM public.trips t
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${params.length - 1} OFFSET $${params.length};
    `;

    const res = await db.query(sql, params);
    return {
      trips: mapRowsToEntities(res.rows),
      total,
      page,
      limit
    };
  }

  async findPublicTrips(query = {}) {
    const params = [];
    const conditions = [`t.visibility = 'public'`];

    if (query.search || query.q) {
      const qStr = (query.search || query.q).trim().toLowerCase();
      params.push(`%${qStr}%`);
      const pIdx = params.length;
      conditions.push(`(LOWER(t.title) LIKE $${pIdx} OR LOWER(COALESCE(t.description, '')) LIKE $${pIdx})`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countRes = await db.query(
      `SELECT COUNT(*) FROM public.trips t ${whereClause};`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const { page, limit, offset } = parsePagination(query);

    params.push(limit, offset);
    const sql = `
      SELECT t.*, p.first_name AS owner_first_name, p.last_name AS owner_last_name
      FROM public.trips t
      LEFT JOIN public.profiles p ON p.id = t.user_id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length};
    `;

    const res = await db.query(sql, params);
    const trips = mapRowsToEntities(res.rows).map(t => {
      if (t.ownerFirstName) {
        t.owner = {
          name: `${t.ownerFirstName} ${t.ownerLastName || ''}`.trim()
        };
      }
      return t;
    });

    return {
      trips,
      total,
      page,
      limit
    };
  }

  async create(tripData) {
    const title = (tripData.name || tripData.title || 'Untitled Trip').trim();
    const budget = tripData.totalBudget !== undefined ? Number(tripData.totalBudget) : (tripData.budget !== undefined ? Number(tripData.budget) : 0);
    const visibility = (tripData.visibility || 'private').toLowerCase();
    const status = (tripData.status || 'upcoming').toLowerCase();

    const res = await db.query(
      `INSERT INTO public.trips (
        user_id,
        title,
        description,
        start_date,
        end_date,
        overall_budget,
        total_budget,
        visibility,
        status,
        cover_image_url,
        cover_photo
      ) VALUES ($1::uuid, $2, $3, $4::date, $5::date, $6, $6, $7, $8, $9, $9)
      RETURNING *;`,
      [
        tripData.userId,
        title,
        tripData.description || null,
        tripData.startDate,
        tripData.endDate,
        budget,
        visibility,
        status,
        tripData.coverPhoto || tripData.coverImage || null
      ]
    );

    return mapRowToEntity(res.rows[0]);
  }

  async update(id, updateData) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates = [];
    const params = [];

    if (updateData.name !== undefined || updateData.title !== undefined) {
      const title = (updateData.name || updateData.title).trim();
      params.push(title);
      updates.push(`title = $${params.length}`);
    }

    if (updateData.description !== undefined) {
      params.push(updateData.description);
      updates.push(`description = $${params.length}`);
    }

    if (updateData.startDate !== undefined) {
      params.push(updateData.startDate);
      updates.push(`start_date = $${params.length}::date`);
    }

    if (updateData.endDate !== undefined) {
      params.push(updateData.endDate);
      updates.push(`end_date = $${params.length}::date`);
    }

    if (updateData.totalBudget !== undefined || updateData.budget !== undefined) {
      const budget = updateData.totalBudget !== undefined ? Number(updateData.totalBudget) : Number(updateData.budget);
      params.push(budget);
      updates.push(`overall_budget = $${params.length}`);
      updates.push(`total_budget = $${params.length}`);
    }

    if (updateData.visibility !== undefined) {
      params.push(updateData.visibility.toLowerCase());
      updates.push(`visibility = $${params.length}`);
    }

    if (updateData.status !== undefined) {
      params.push(updateData.status.toLowerCase());
      updates.push(`status = $${params.length}`);
    }

    if (updateData.coverPhoto !== undefined || updateData.coverImage !== undefined) {
      const photo = updateData.coverPhoto || updateData.coverImage;
      params.push(photo);
      updates.push(`cover_image_url = $${params.length}`);
      updates.push(`cover_photo = $${params.length}`);
    }

    if (updates.length === 0) return existing;

    updates.push(`updated_at = now()`);
    params.push(String(id));

    const res = await db.query(
      `UPDATE public.trips
       SET ${updates.join(', ')}
       WHERE id::text = $${params.length}::text
       RETURNING *;`,
      params
    );

    return mapRowToEntity(res.rows[0]);
  }

  async delete(id) {
    if (!id) return false;
    const res = await db.query(`DELETE FROM public.trips WHERE id::text = $1::text RETURNING id;`, [String(id)]);
    return res.rowCount > 0;
  }
}

module.exports = new TripRepository();
