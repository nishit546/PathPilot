const db = require('../config/database');
const { mapRowToEntity, mapRowsToEntities } = require('../utils/dbHelper');

class SharedExpenseRepository {
  async create(data) {
    const desc = (data.description || data.title || 'Shared Expense').trim();
    const res = await db.query(
      `INSERT INTO public.shared_expenses (
        trip_id,
        paid_by,
        amount,
        description,
        category,
        split_type,
        date,
        receipt_url
      ) VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7::date, $8)
      RETURNING *;`,
      [
        data.tripId,
        data.paidBy,
        Number(data.amount || 0),
        desc,
        (data.category || 'OTHER').toUpperCase(),
        (data.splitType || 'EQUAL').toUpperCase(),
        data.date || new Date().toISOString().split('T')[0],
        data.receiptUrl || null
      ]
    );

    return this.findById(res.rows[0].id);
  }

  async findAllByTripId(tripId) {
    return this.findByTripId(tripId);
  }

  async findById(id) {
    if (!id) return null;
    const res = await db.query(
      `SELECT se.*, p.first_name AS payer_first_name, p.last_name AS payer_last_name, p.avatar_url AS payer_avatar
       FROM public.shared_expenses se
       LEFT JOIN public.profiles p ON p.id = se.paid_by
       WHERE se.id::text = $1::text;`,
      [String(id)]
    );
    if (!res.rows[0]) return null;
    const exp = mapRowToEntity(res.rows[0]);
    if (res.rows[0].payer_first_name) {
      exp.payer = {
        id: exp.paidBy,
        name: `${res.rows[0].payer_first_name} ${res.rows[0].payer_last_name || ''}`.trim(),
        profilePhoto: res.rows[0].payer_avatar
      };
    }
    return exp;
  }

  async findByTripId(tripId) {
    if (!tripId) return [];
    const res = await db.query(
      `SELECT se.*, p.first_name AS payer_first_name, p.last_name AS payer_last_name, p.avatar_url AS payer_avatar
       FROM public.shared_expenses se
       LEFT JOIN public.profiles p ON p.id = se.paid_by
       WHERE se.trip_id::text = $1::text
       ORDER BY se.date DESC, se.created_at DESC;`,
      [String(tripId)]
    );
    const list = mapRowsToEntities(res.rows).map(exp => {
      if (exp.payerFirstName) {
        exp.payer = {
          id: exp.paidBy,
          name: `${exp.payerFirstName} ${exp.payerLastName || ''}`.trim(),
          profilePhoto: exp.payerAvatar
        };
      }
      return exp;
    });

    list.expenses = list;
    list.total = list.length;
    list.page = 1;
    list.limit = list.length;

    return list;
  }

  async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates = [];
    const params = [];

    if (data.description !== undefined) {
      params.push(data.description.trim());
      updates.push(`description = $${params.length}`);
    }
    if (data.amount !== undefined) {
      params.push(Number(data.amount));
      updates.push(`amount = $${params.length}`);
    }
    if (data.category !== undefined) {
      params.push(data.category.toUpperCase());
      updates.push(`category = $${params.length}`);
    }
    if (data.splitType !== undefined) {
      params.push(data.splitType.toUpperCase());
      updates.push(`split_type = $${params.length}`);
    }
    if (data.date !== undefined) {
      params.push(data.date);
      updates.push(`date = $${params.length}::date`);
    }
    if (data.paidBy !== undefined) {
      params.push(String(data.paidBy));
      updates.push(`paid_by = $${params.length}::uuid`);
    }
    if (data.receiptUrl !== undefined) {
      params.push(data.receiptUrl);
      updates.push(`receipt_url = $${params.length}`);
    }

    if (updates.length === 0) return existing;

    updates.push(`updated_at = now()`);
    params.push(String(id));

    await db.query(
      `UPDATE public.shared_expenses
       SET ${updates.join(', ')}
       WHERE id::text = $${params.length}::text;`,
      params
    );

    return this.findById(id);
  }

  async delete(id) {
    if (!id) return false;
    const res = await db.query(
      `DELETE FROM public.shared_expenses WHERE id::text = $1::text RETURNING id;`,
      [String(id)]
    );
    return res.rowCount > 0;
  }

  async deleteByTripId(tripId) {
    if (!tripId) return 0;
    const res = await db.query(
      `DELETE FROM public.shared_expenses WHERE trip_id::text = $1::text;`,
      [String(tripId)]
    );
    return res.rowCount;
  }
}

module.exports = new SharedExpenseRepository();
