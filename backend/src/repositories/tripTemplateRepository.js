const db = require('../config/database');
const { mapRowToEntity, mapRowsToEntities } = require('../utils/dbHelper');
const { parsePagination } = require('../utils/pagination');

class TripTemplateRepository {
  async create(data) {
    const userId = data.userId || data.creatorId;
    const origTripId = data.originalTripId || data.sourceTripId || null;
    const estBudget = Number(data.estimatedBudget !== undefined ? data.estimatedBudget : (data.metadata ? data.metadata.estimatedCost : 0)) || 0;
    const durDays = Number(data.durationDays !== undefined ? data.durationDays : (data.metadata ? data.metadata.totalDays : 1)) || 1;
    const visibility = (data.visibility || (data.isPublic !== undefined ? (data.isPublic ? 'PUBLIC' : 'PRIVATE') : 'PUBLIC')).toUpperCase();

    const res = await db.query(
      `INSERT INTO public.trip_templates (
        user_id,
        original_trip_id,
        name,
        description,
        category,
        tags,
        estimated_budget,
        duration_days,
        copy_count,
        favorite_count,
        visibility,
        sections_data
      ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
      RETURNING *;`,
      [
        String(userId),
        origTripId,
        (data.name || 'Untitled Template').trim(),
        data.description || null,
        (data.category || 'EXPLORATION').toUpperCase(),
        data.tags || [],
        estBudget,
        durDays,
        Number(data.copyCount || 0),
        Number(data.favoriteCount || 0),
        visibility,
        JSON.stringify(data.sectionsData || data.sections || [])
      ]
    );

    return this.findById(res.rows[0].id);
  }

  async findAll(query = {}) {
    const params = [];
    const conditions = [];

    if (query.visibility) {
      params.push(query.visibility.toUpperCase());
      conditions.push(`visibility = $${params.length}`);
    } else if (!query.userId && !query.creatorId) {
      conditions.push(`visibility = 'PUBLIC'`);
    }

    if (query.category) {
      params.push(query.category.toUpperCase());
      conditions.push(`category = $${params.length}`);
    }

    if (query.search || query.q) {
      const qStr = (query.search || query.q).trim().toLowerCase();
      params.push(`%${qStr}%`);
      const pIdx = params.length;
      conditions.push(`(LOWER(tt.name) LIKE $${pIdx} OR LOWER(COALESCE(tt.description, '')) LIKE $${pIdx})`);
    }

    if (query.userId) {
      params.push(String(query.userId));
      conditions.push(`tt.user_id::text = $${params.length}::text`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT COUNT(*) FROM public.trip_templates tt ${whereClause};`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const { page, limit, offset } = parsePagination(query);

    let orderBy = 'tt.copy_count DESC, tt.favorite_count DESC, tt.created_at DESC';
    if (query.sortBy) {
      const order = (query.order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      if (query.sortBy.toLowerCase() === 'popular' || query.sortBy.toLowerCase() === 'copycount') {
        orderBy = `tt.copy_count ${order}`;
      } else if (query.sortBy.toLowerCase() === 'favorites' || query.sortBy.toLowerCase() === 'favoritecount') {
        orderBy = `tt.favorite_count ${order}`;
      } else if (query.sortBy.toLowerCase() === 'budget') {
        orderBy = `tt.estimated_budget ${order}`;
      } else if (query.sortBy.toLowerCase() === 'duration') {
        orderBy = `tt.duration_days ${order}`;
      }
    }

    params.push(limit, offset);
    const sql = `
      SELECT tt.*, p.first_name, p.last_name, p.avatar_url
      FROM public.trip_templates tt
      LEFT JOIN public.profiles p ON p.id = tt.user_id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${params.length - 1} OFFSET $${params.length};
    `;

    const res = await db.query(sql, params);
    const templates = mapRowsToEntities(res.rows).map(t => {
      if (t.firstName) {
        t.creator = {
          id: t.userId,
          name: `${t.firstName} ${t.lastName || ''}`.trim() || 'Traveler',
          profilePhoto: t.avatarUrl
        };
      }
      return t;
    });

    return {
      templates,
      total,
      page,
      limit
    };
  }

  async findById(id) {
    if (!id) return null;
    const res = await db.query(
      `SELECT tt.*, p.first_name, p.last_name, p.avatar_url
       FROM public.trip_templates tt
       LEFT JOIN public.profiles p ON p.id = tt.user_id
       WHERE tt.id::text = $1::text;`,
      [String(id)]
    );
    if (!res.rows[0]) return null;
    const t = mapRowToEntity(res.rows[0]);
    if (t.firstName) {
      t.creator = {
        id: t.userId,
        name: `${t.firstName} ${t.lastName || ''}`.trim() || 'Traveler',
        profilePhoto: t.avatarUrl
      };
    }
    return t;
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
      params.push(data.category.toUpperCase());
      updates.push(`category = $${params.length}`);
    }
    if (data.tags !== undefined) {
      params.push(data.tags);
      updates.push(`tags = $${params.length}`);
    }
    if (data.estimatedBudget !== undefined) {
      params.push(Number(data.estimatedBudget));
      updates.push(`estimated_budget = $${params.length}`);
    }
    if (data.durationDays !== undefined) {
      params.push(Number(data.durationDays));
      updates.push(`duration_days = $${params.length}`);
    }
    if (data.visibility !== undefined || data.isPublic !== undefined) {
      const vis = data.visibility ? data.visibility.toUpperCase() : (data.isPublic ? 'PUBLIC' : 'PRIVATE');
      params.push(vis);
      updates.push(`visibility = $${params.length}`);
    }
    if (data.sectionsData !== undefined || data.sections !== undefined) {
      params.push(JSON.stringify(data.sectionsData || data.sections));
      updates.push(`sections_data = $${params.length}::jsonb`);
    }

    if (updates.length === 0) return existing;

    updates.push(`updated_at = now()`);
    params.push(String(id));

    await db.query(
      `UPDATE public.trip_templates
       SET ${updates.join(', ')}
       WHERE id::text = $${params.length}::text;`,
      params
    );

    return this.findById(id);
  }

  async delete(id) {
    if (!id) return false;
    const res = await db.query(
      `DELETE FROM public.trip_templates WHERE id::text = $1::text RETURNING id;`,
      [String(id)]
    );
    return res.rowCount > 0;
  }

  async incrementCopyCount(id) {
    const res = await db.query(
      `UPDATE public.trip_templates
       SET copy_count = copy_count + 1, updated_at = now()
       WHERE id::text = $1::text
       RETURNING *;`,
      [String(id)]
    );
    if (!res.rows[0]) return null;
    return this.findById(id);
  }

  async incrementFavoriteCount(id) {
    const res = await db.query(
      `UPDATE public.trip_templates
       SET favorite_count = favorite_count + 1, updated_at = now()
       WHERE id::text = $1::text
       RETURNING *;`,
      [String(id)]
    );
    if (!res.rows[0]) return null;
    return this.findById(id);
  }

  async decrementFavoriteCount(id) {
    const res = await db.query(
      `UPDATE public.trip_templates
       SET favorite_count = GREATEST(0, favorite_count - 1), updated_at = now()
       WHERE id::text = $1::text
       RETURNING *;`,
      [String(id)]
    );
    if (!res.rows[0]) return null;
    return this.findById(id);
  }

  async adjustFavoriteCount(id, delta = 1) {
    if (delta > 0) return this.incrementFavoriteCount(id);
    return this.decrementFavoriteCount(id);
  }

  async findByCreatorId(creatorId, query = {}) {
    return this.findAll({ ...query, userId: creatorId });
  }

  async findPublicTemplates(query = {}) {
    return this.findAll({ ...query, visibility: 'PUBLIC' });
  }
}

module.exports = new TripTemplateRepository();
