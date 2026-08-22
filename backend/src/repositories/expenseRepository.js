const db = require('../config/database');
const { mapRowToEntity, mapRowsToEntities } = require('../utils/dbHelper');
const { parsePagination } = require('../utils/pagination');

const normalizeCategory = (cat) => {
  if (!cat) return 'other';
  const c = String(cat).toLowerCase();
  if (['transport', 'accommodation', 'food', 'activity', 'entry_fee', 'shopping', 'other'].includes(c)) {
    return c;
  }
  if (['flight', 'train', 'bus', 'car', 'travel'].includes(c)) return 'transport';
  if (['hotel', 'hostel', 'stay', 'airbnb'].includes(c)) return 'accommodation';
  if (['dining', 'meal', 'restaurant', 'drinks'].includes(c)) return 'food';
  if (['tour', 'sightseeing', 'ticket'].includes(c)) return 'activity';
  return 'other';
};

class ExpenseRepository {
  async findById(id) {
    if (!id) return null;
    const res = await db.query(
      `SELECT * FROM public.budget_items WHERE id::text = $1::text;`,
      [String(id)]
    );
    if (!res.rows[0]) return null;
    const exp = mapRowToEntity(res.rows[0]);
    exp.category = exp.category.toUpperCase();
    return exp;
  }

  async findByTripId(tripId, query = {}) {
    const params = [String(tripId)];
    const conditions = [`trip_id::text = $1::text`];

    if (query.category) {
      const normCat = normalizeCategory(query.category);
      params.push(normCat);
      conditions.push(`category = $${params.length}`);
    }

    if (query.sectionId) {
      params.push(String(query.sectionId));
      conditions.push(`section_id::text = $${params.length}::text`);
    }

    if (query.dayId) {
      params.push(String(query.dayId));
      conditions.push(`day_id::text = $${params.length}::text`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countRes = await db.query(
      `SELECT COUNT(*) FROM public.budget_items ${whereClause};`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const { page, limit, offset } = parsePagination(query);

    params.push(limit, offset);
    const sql = `
      SELECT *
      FROM public.budget_items
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length};
    `;

    const res = await db.query(sql, params);
    const expenses = mapRowsToEntities(res.rows).map(exp => {
      exp.category = exp.category.toUpperCase();
      return exp;
    });

    expenses.expenses = expenses;
    expenses.total = total;
    expenses.page = page;
    expenses.limit = limit;

    return expenses;
  }

  async create(data) {
    const category = normalizeCategory(data.category);
    const amount = Number(data.amount || 0);

    const res = await db.query(
      `INSERT INTO public.budget_items (
        trip_id,
        section_id,
        day_id,
        category,
        description,
        amount
      ) VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6)
      RETURNING *;`,
      [
        data.tripId,
        data.sectionId || null,
        data.dayId || null,
        category,
        (data.description || 'Expense').trim(),
        amount
      ]
    );

    const exp = mapRowToEntity(res.rows[0]);
    exp.category = exp.category.toUpperCase();
    return exp;
  }

  async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates = [];
    const params = [];

    if (data.category !== undefined) {
      const cat = normalizeCategory(data.category);
      params.push(cat);
      updates.push(`category = $${params.length}`);
    }
    if (data.description !== undefined) {
      params.push(data.description.trim());
      updates.push(`description = $${params.length}`);
    }
    if (data.amount !== undefined) {
      params.push(Number(data.amount));
      updates.push(`amount = $${params.length}`);
    }
    if (data.sectionId !== undefined) {
      params.push(data.sectionId || null);
      updates.push(`section_id = $${params.length}::uuid`);
    }
    if (data.dayId !== undefined) {
      params.push(data.dayId || null);
      updates.push(`day_id = $${params.length}::uuid`);
    }

    if (updates.length === 0) return existing;

    updates.push(`updated_at = now()`);
    params.push(String(id));

    const res = await db.query(
      `UPDATE public.budget_items
       SET ${updates.join(', ')}
       WHERE id::text = $${params.length}::text
       RETURNING *;`,
      params
    );

    const exp = mapRowToEntity(res.rows[0]);
    exp.category = exp.category.toUpperCase();
    return exp;
  }

  async delete(id) {
    if (!id) return false;
    const res = await db.query(`DELETE FROM public.budget_items WHERE id::text = $1::text RETURNING id;`, [String(id)]);
    return res.rowCount > 0;
  }

  async deleteByTripId(tripId) {
    if (!tripId) return 0;
    const res = await db.query(`DELETE FROM public.budget_items WHERE trip_id::text = $1::text;`, [String(tripId)]);
    return res.rowCount;
  }

  async deleteByDayId(dayId) {
    if (!dayId) return 0;
    const res = await db.query(`DELETE FROM public.budget_items WHERE day_id::text = $1::text;`, [String(dayId)]);
    return res.rowCount;
  }

  async deleteBySectionId(sectionId) {
    if (!sectionId) return 0;
    const res = await db.query(`DELETE FROM public.budget_items WHERE section_id::text = $1::text;`, [String(sectionId)]);
    return res.rowCount;
  }
}

module.exports = new ExpenseRepository();
