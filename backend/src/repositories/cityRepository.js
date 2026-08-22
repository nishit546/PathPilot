const db = require('../config/database');
const { mapRowToEntity, mapRowsToEntities } = require('../utils/dbHelper');
const { parsePagination } = require('../utils/pagination');

class CityRepository {
  async findById(id) {
    if (!id) return null;
    const res = await db.query(
      `SELECT * FROM public.cities WHERE id::text = $1::text;`,
      [String(id)]
    );
    if (!res.rows[0]) return null;
    return mapRowToEntity(res.rows[0]);
  }

  async findAll(query = {}) {
    const params = [];
    const conditions = [];

    if (query.search || query.q) {
      const qStr = (query.search || query.q).trim().toLowerCase();
      params.push(`%${qStr}%`);
      const pIdx = params.length;
      conditions.push(`(LOWER(name) LIKE $${pIdx} OR LOWER(country) LIKE $${pIdx} OR LOWER(COALESCE(state_region, '')) LIKE $${pIdx})`);
    }

    if (query.country) {
      params.push(`%${query.country.trim().toLowerCase()}%`);
      conditions.push(`LOWER(country) LIKE $${params.length}`);
    }

    if (query.region) {
      params.push(`%${query.region.trim().toLowerCase()}%`);
      conditions.push(`LOWER(COALESCE(state_region, '')) LIKE $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(`SELECT COUNT(*) FROM public.cities ${whereClause};`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const { page, limit, offset } = parsePagination(query);

    let orderBy = 'name ASC';
    if (query.sortBy) {
      const order = (query.order || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      if (query.sortBy.toLowerCase() === 'name') orderBy = `name ${order}`;
      if (query.sortBy.toLowerCase() === 'country') orderBy = `country ${order}`;
      if (query.sortBy.toLowerCase() === 'created_at' || query.sortBy.toLowerCase() === 'createdat') orderBy = `created_at ${order}`;
    }

    params.push(limit, offset);
    const sql = `
      SELECT *
      FROM public.cities
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${params.length - 1} OFFSET $${params.length};
    `;

    const res = await db.query(sql, params);
    return {
      cities: mapRowsToEntities(res.rows),
      total,
      page,
      limit
    };
  }

  async create(data) {
    const res = await db.query(
      `INSERT INTO public.cities (
        name,
        country,
        state_region,
        description,
        image_url,
        latitude,
        longitude
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;`,
      [
        data.name.trim(),
        data.country.trim(),
        data.region || data.stateRegion || null,
        data.description || null,
        data.imageUrl || data.image_url || data.coverImage || null,
        data.latitude !== undefined ? data.latitude : null,
        data.longitude !== undefined ? data.longitude : null
      ]
    );

    return mapRowToEntity(res.rows[0]);
  }

  async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const res = await db.query(
      `UPDATE public.cities
       SET
         name = COALESCE($1, name),
         country = COALESCE($2, country),
         state_region = COALESCE($3, state_region),
         description = COALESCE($4, description),
         image_url = COALESCE($5, image_url),
         latitude = COALESCE($6, latitude),
         longitude = COALESCE($7, longitude),
         updated_at = now()
       WHERE id = $8::uuid
       RETURNING *;`,
      [
        data.name || null,
        data.country || null,
        data.region || data.stateRegion || null,
        data.description || null,
        data.imageUrl || data.image_url || data.coverImage || null,
        data.latitude !== undefined ? data.latitude : null,
        data.longitude !== undefined ? data.longitude : null,
        id
      ]
    );

    return mapRowToEntity(res.rows[0]);
  }

  async delete(id) {
    if (!id) return false;
    const res = await db.query(`DELETE FROM public.cities WHERE id = $1::uuid RETURNING id;`, [id]);
    return res.rowCount > 0;
  }
}

module.exports = new CityRepository();
