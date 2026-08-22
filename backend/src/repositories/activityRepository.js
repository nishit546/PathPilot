const db = require('../config/database');
const { mapRowToEntity, mapRowsToEntities } = require('../utils/dbHelper');
const { parsePagination } = require('../utils/pagination');

class ActivityRepository {
  async findById(id) {
    if (!id) return null;
    const res = await db.query(
      `SELECT a.*, c.name AS city_name, c.country AS city_country
       FROM public.activities a
       LEFT JOIN public.cities c ON c.id = a.city_id
       WHERE a.id::text = $1::text;`,
      [String(id)]
    );
    if (!res.rows[0]) return null;
    const item = mapRowToEntity(res.rows[0]);
    if (res.rows[0].city_name) {
      item.city = {
        id: item.cityId,
        name: res.rows[0].city_name,
        country: res.rows[0].city_country
      };
    }
    return item;
  }

  async findByCityId(cityId) {
    if (!cityId) return [];
    const res = await db.query(
      `SELECT * FROM public.activities WHERE city_id::text = $1::text ORDER BY name ASC;`,
      [String(cityId)]
    );
    return mapRowsToEntities(res.rows);
  }

  async findAll(query = {}) {
    const params = [];
    const conditions = [];

    if (query.search || query.q) {
      const qStr = (query.search || query.q).trim().toLowerCase();
      params.push(`%${qStr}%`);
      const pIdx = params.length;
      conditions.push(`(LOWER(a.name) LIKE $${pIdx} OR LOWER(COALESCE(a.description, '')) LIKE $${pIdx})`);
    }

    if (query.category) {
      params.push(query.category.toLowerCase());
      conditions.push(`LOWER(a.category) = $${params.length}`);
    }

    if (query.cityId) {
      params.push(String(query.cityId));
      conditions.push(`a.city_id::text = $${params.length}::text`);
    }

    if (query.minCost !== undefined && query.minCost !== null && query.minCost !== '') {
      params.push(Number(query.minCost));
      conditions.push(`a.estimated_cost >= $${params.length}`);
    }

    if (query.maxCost !== undefined && query.maxCost !== null && query.maxCost !== '') {
      params.push(Number(query.maxCost));
      conditions.push(`a.estimated_cost <= $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT COUNT(*) FROM public.activities a ${whereClause};`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const { page, limit, offset } = parsePagination(query);

    let orderBy = 'a.name ASC';
    if (query.sortBy) {
      const order = (query.order || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      if (query.sortBy.toLowerCase() === 'name') orderBy = `a.name ${order}`;
      if (query.sortBy.toLowerCase() === 'cost' || query.sortBy.toLowerCase() === 'estimated_cost') orderBy = `a.estimated_cost ${order}`;
      if (query.sortBy.toLowerCase() === 'duration' || query.sortBy.toLowerCase() === 'duration_minutes') orderBy = `a.duration_minutes ${order}`;
    }

    params.push(limit, offset);
    const sql = `
      SELECT a.*, c.name AS city_name, c.country AS city_country
      FROM public.activities a
      LEFT JOIN public.cities c ON c.id = a.city_id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${params.length - 1} OFFSET $${params.length};
    `;

    const res = await db.query(sql, params);
    const activities = mapRowsToEntities(res.rows).map(act => {
      if (act.cityName) {
        act.city = {
          id: act.cityId,
          name: act.cityName,
          country: act.cityCountry
        };
      }
      return act;
    });

    return {
      activities,
      total,
      page,
      limit
    };
  }

  async create(data) {
    const cost = data.estimatedCost !== undefined ? Number(data.estimatedCost) : (data.cost !== undefined ? Number(data.cost) : 0);
    const durationMinutes = data.durationMinutes !== undefined ? Number(data.durationMinutes) : (data.duration ? Math.round(Number(data.duration) * 60) : 120);

    const res = await db.query(
      `INSERT INTO public.activities (
        city_id,
        name,
        description,
        category,
        estimated_cost,
        duration_minutes,
        image_url
      ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7)
      RETURNING *;`,
      [
        data.cityId,
        data.name.trim(),
        data.description || null,
        (data.category || 'culture').toLowerCase(),
        cost,
        durationMinutes,
        data.imageUrl || data.image_url || null
      ]
    );

    return mapRowToEntity(res.rows[0]);
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
    if (data.description !== undefined) {
      params.push(data.description);
      updates.push(`description = $${params.length}`);
    }
    if (data.category !== undefined) {
      params.push(data.category.toLowerCase());
      updates.push(`category = $${params.length}`);
    }
    if (data.estimatedCost !== undefined || data.cost !== undefined) {
      const cost = data.estimatedCost !== undefined ? Number(data.estimatedCost) : Number(data.cost);
      params.push(cost);
      updates.push(`estimated_cost = $${params.length}`);
    }
    if (data.duration !== undefined || data.durationMinutes !== undefined) {
      const dur = data.durationMinutes !== undefined ? Number(data.durationMinutes) : Math.round(Number(data.duration) * 60);
      params.push(dur);
      updates.push(`duration_minutes = $${params.length}`);
    }
    if (data.imageUrl !== undefined || data.image_url !== undefined) {
      params.push(data.imageUrl || data.image_url);
      updates.push(`image_url = $${params.length}`);
    }

    if (updates.length === 0) return existing;

    updates.push(`updated_at = now()`);
    params.push(String(id));

    const res = await db.query(
      `UPDATE public.activities
       SET ${updates.join(', ')}
       WHERE id::text = $${params.length}::text
       RETURNING *;`,
      params
    );

    return mapRowToEntity(res.rows[0]);
  }

  async delete(id) {
    if (!id) return false;
    const res = await db.query(`DELETE FROM public.activities WHERE id::text = $1::text RETURNING id;`, [String(id)]);
    return res.rowCount > 0;
  }
}

module.exports = new ActivityRepository();
