const db = require('../config/database');
const { mapRowToEntity, mapRowsToEntities } = require('../utils/dbHelper');

class SearchRepository {
  async addRecentSearch(userId, queryText, type = 'ALL') {
    if (!userId || !queryText) return null;
    const cleanQuery = queryText.trim();
    if (!cleanQuery) return null;

    // Remove existing duplicate query for user
    await db.query(
      `DELETE FROM public.recent_searches
       WHERE user_id::text = $1::text AND LOWER(query) = LOWER($2);`,
      [String(userId), cleanQuery]
    );

    // Insert new search
    const res = await db.query(
      `INSERT INTO public.recent_searches (
        user_id,
        query,
        search_type
      ) VALUES ($1::uuid, $2, $3)
      RETURNING *;`,
      [String(userId), cleanQuery, type.toUpperCase()]
    );

    // Keep only last 10
    await db.query(
      `DELETE FROM public.recent_searches
       WHERE id IN (
         SELECT id FROM public.recent_searches
         WHERE user_id::text = $1::text
         ORDER BY created_at DESC
         OFFSET 10
       );`,
      [String(userId)]
    );

    return mapRowToEntity(res.rows[0]);
  }

  async getRecentSearches(userId, limit = 5) {
    if (!userId) return [];
    const res = await db.query(
      `SELECT * FROM public.recent_searches
       WHERE user_id::text = $1::text
       ORDER BY created_at DESC
       LIMIT $2;`,
      [String(userId), limit]
    );
    return mapRowsToEntities(res.rows);
  }

  async clearRecentSearches(userId) {
    if (!userId) return 0;
    const res = await db.query(
      `DELETE FROM public.recent_searches WHERE user_id::text = $1::text;`,
      [String(userId)]
    );
    return res.rowCount;
  }

  async deleteRecentSearch(userId, searchId) {
    if (!userId || !searchId) return false;
    const res = await db.query(
      `DELETE FROM public.recent_searches WHERE id::text = $1::text AND user_id::text = $2::text RETURNING id;`,
      [String(searchId), String(userId)]
    );
    return res.rowCount > 0;
  }
}

module.exports = new SearchRepository();
