const db = require('../config/database');
const { mapRowToEntity, mapRowsToEntities } = require('../utils/dbHelper');

class TemplateFavoriteRepository {
  async create(templateId, userId) {
    const res = await db.query(
      `INSERT INTO public.template_favorites (
        template_id,
        user_id
      ) VALUES ($1::uuid, $2::uuid)
      ON CONFLICT (template_id, user_id) DO NOTHING
      RETURNING *;`,
      [templateId, userId]
    );
    if (!res.rows[0]) return { templateId, userId, alreadyFavorited: true };
    return mapRowToEntity(res.rows[0]);
  }

  async delete(templateId, userId) {
    const res = await db.query(
      `DELETE FROM public.template_favorites
       WHERE template_id::text = $1::text AND user_id::text = $2::text
       RETURNING id;`,
      [String(templateId), String(userId)]
    );
    return res.rowCount > 0;
  }

  async isFavorited(templateId, userId) {
    if (!templateId || !userId) return false;
    const res = await db.query(
      `SELECT 1 FROM public.template_favorites
       WHERE template_id::text = $1::text AND user_id::text = $2::text;`,
      [String(templateId), String(userId)]
    );
    return res.rowCount > 0;
  }

  async findByTemplateAndUser(templateId, userId) {
    if (!templateId || !userId) return null;
    const res = await db.query(
      `SELECT * FROM public.template_favorites
       WHERE template_id::text = $1::text AND user_id::text = $2::text;`,
      [String(templateId), String(userId)]
    );
    if (!res.rows[0]) return null;
    return mapRowToEntity(res.rows[0]);
  }

  async findByUserId(userId, query = {}) {
    if (!userId) return { favorites: [], total: 0, page: 1, limit: 20 };
    const res = await db.query(
      `SELECT tf.*, tt.name AS template_name, tt.category, tt.estimated_budget, tt.duration_days, tt.copy_count, tt.favorite_count
       FROM public.template_favorites tf
       JOIN public.trip_templates tt ON tt.id = tf.template_id
       WHERE tf.user_id::text = $1::text
       ORDER BY tf.created_at DESC;`,
      [String(userId)]
    );
    const favorites = mapRowsToEntities(res.rows);
    return {
      favorites,
      total: favorites.length,
      page: Number(query.page || 1),
      limit: Number(query.limit || 20)
    };
  }
}

module.exports = new TemplateFavoriteRepository();
