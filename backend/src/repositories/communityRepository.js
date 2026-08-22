const db = require('../config/database');
const { mapRowToEntity, mapRowsToEntities } = require('../utils/dbHelper');
const { parsePagination } = require('../utils/pagination');

class CommunityRepository {
  async findAll(query = {}) {
    const params = [];
    const conditions = [];

    if (query.search || query.q) {
      const qStr = (query.search || query.q).trim().toLowerCase();
      params.push(`%${qStr}%`);
      const pIdx = params.length;
      conditions.push(`(LOWER(cp.title) LIKE $${pIdx} OR LOWER(cp.content) LIKE $${pIdx})`);
    }

    if (query.userId) {
      params.push(String(query.userId));
      conditions.push(`cp.user_id::text = $${params.length}::text`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT COUNT(*) FROM public.community_posts cp ${whereClause};`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const { page, limit, offset } = parsePagination(query);

    params.push(limit, offset);
    const sql = `
      SELECT cp.*, p.first_name, p.last_name, p.avatar_url, p.city AS user_city, p.country AS user_country
      FROM public.community_posts cp
      LEFT JOIN public.profiles p ON p.id = cp.user_id
      ${whereClause}
      ORDER BY cp.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length};
    `;

    const res = await db.query(sql, params);
    const posts = mapRowsToEntities(res.rows).map(post => {
      if (post.firstName) {
        post.user = {
          id: post.userId,
          name: `${post.firstName} ${post.lastName || ''}`.trim() || 'Traveler',
          profilePhoto: post.avatarUrl,
          city: post.userCity,
          country: post.userCountry
        };
      }
      return post;
    });

    return {
      posts,
      total,
      page,
      limit
    };
  }

  async findById(id) {
    if (!id) return null;
    const res = await db.query(
      `SELECT cp.*, p.first_name, p.last_name, p.avatar_url, p.city AS user_city, p.country AS user_country
       FROM public.community_posts cp
       LEFT JOIN public.profiles p ON p.id = cp.user_id
       WHERE cp.id::text = $1::text;`,
      [String(id)]
    );
    if (!res.rows[0]) return null;
    const post = mapRowToEntity(res.rows[0]);
    if (post.firstName) {
      post.user = {
        id: post.userId,
        name: `${post.firstName} ${post.lastName || ''}`.trim() || 'Traveler',
        profilePhoto: post.avatarUrl,
        city: post.userCity,
        country: post.userCountry
      };
    }
    return post;
  }

  async create(data) {
    const res = await db.query(
      `INSERT INTO public.community_posts (
        user_id,
        trip_id,
        activity_id,
        title,
        content,
        image_url
      ) VALUES ($1::uuid, $2, $3, $4, $5, $6)
      RETURNING *;`,
      [
        data.userId,
        data.tripId || null,
        data.activityId || null,
        data.title.trim(),
        data.content.trim(),
        data.imageUrl || data.image_url || null
      ]
    );

    return this.findById(res.rows[0].id);
  }

  async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates = [];
    const params = [];

    if (data.title !== undefined) {
      params.push(data.title.trim());
      updates.push(`title = $${params.length}`);
    }
    if (data.content !== undefined) {
      params.push(data.content.trim());
      updates.push(`content = $${params.length}`);
    }
    if (data.imageUrl !== undefined || data.image_url !== undefined) {
      params.push(data.imageUrl || data.image_url);
      updates.push(`image_url = $${params.length}`);
    }
    if (data.likesCount !== undefined) {
      params.push(Number(data.likesCount));
      updates.push(`likes_count = $${params.length}`);
    }

    if (updates.length === 0) return existing;

    updates.push(`updated_at = now()`);
    params.push(String(id));

    await db.query(
      `UPDATE public.community_posts
       SET ${updates.join(', ')}
       WHERE id::text = $${params.length}::text;`,
      params
    );

    return this.findById(id);
  }

  async delete(id) {
    if (!id) return false;
    const res = await db.query(
      `DELETE FROM public.community_posts WHERE id::text = $1::text RETURNING id;`,
      [String(id)]
    );
    return res.rowCount > 0;
  }
}

module.exports = new CommunityRepository();
