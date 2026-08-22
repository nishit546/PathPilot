const db = require('../config/database');
const { mapRowToEntity, mapRowsToEntities } = require('../utils/dbHelper');

class SharedExpenseSplitRepository {
  async createBulk(splitsData) {
    if (!splitsData || splitsData.length === 0) return [];

    return await db.transaction(async (client) => {
      const created = [];
      for (const s of splitsData) {
        const res = await client.query(
          `INSERT INTO public.shared_expense_splits (
            shared_expense_id,
            user_id,
            share_amount,
            share_percentage,
            is_settled
          ) VALUES ($1::uuid, $2::uuid, $3, $4, $5)
          RETURNING *;`,
          [
            s.sharedExpenseId || s.expenseId,
            s.userId,
            Number(s.shareAmount !== undefined ? s.shareAmount : (s.amount || 0)),
            s.sharePercentage !== undefined ? Number(s.sharePercentage) : (s.percentage !== undefined ? Number(s.percentage) : null),
            Boolean(s.isSettled)
          ]
        );
        created.push(mapRowToEntity(res.rows[0]));
      }
      return created;
    });
  }

  async findByExpenseId(expenseId) {
    if (!expenseId) return [];
    const res = await db.query(
      `SELECT ses.*, p.first_name, p.last_name, p.email, p.avatar_url
       FROM public.shared_expense_splits ses
       LEFT JOIN public.profiles p ON p.id = ses.user_id
       WHERE ses.shared_expense_id::text = $1::text;`,
      [String(expenseId)]
    );
    return mapRowsToEntities(res.rows).map(split => {
      if (split.firstName) {
        split.user = {
          id: split.userId,
          name: `${split.firstName} ${split.lastName || ''}`.trim(),
          profilePhoto: split.avatarUrl
        };
      }
      return split;
    });
  }

  async findByExpenseIds(expenseIds) {
    if (!expenseIds || expenseIds.length === 0) return [];
    const strExpenseIds = expenseIds.map(String);
    const res = await db.query(
      `SELECT ses.*, p.first_name, p.last_name, p.email, p.avatar_url
       FROM public.shared_expense_splits ses
       LEFT JOIN public.profiles p ON p.id = ses.user_id
       WHERE ses.shared_expense_id::text = ANY($1::text[]);`,
      [strExpenseIds]
    );
    return mapRowsToEntities(res.rows).map(split => {
      if (split.firstName) {
        split.user = {
          id: split.userId,
          name: `${split.firstName} ${split.lastName || ''}`.trim(),
          profilePhoto: split.avatarUrl
        };
      }
      return split;
    });
  }

  async findByTripId(tripId) {
    if (!tripId) return [];
    const res = await db.query(
      `SELECT ses.*, se.paid_by, se.amount AS total_expense_amount, se.category, se.description,
              p.first_name, p.last_name
       FROM public.shared_expense_splits ses
       JOIN public.shared_expenses se ON se.id = ses.shared_expense_id
       LEFT JOIN public.profiles p ON p.id = ses.user_id
       WHERE se.trip_id::text = $1::text;`,
      [String(tripId)]
    );
    return mapRowsToEntities(res.rows).map(split => {
      if (split.firstName) {
        split.user = {
          id: split.userId,
          name: `${split.firstName} ${split.lastName || ''}`.trim()
        };
      }
      return split;
    });
  }

  async updateSettlementStatus(id, isSettled) {
    const res = await db.query(
      `UPDATE public.shared_expense_splits
       SET is_settled = $1
       WHERE id::text = $2::text
       RETURNING *;`,
      [Boolean(isSettled), String(id)]
    );
    if (!res.rows[0]) return null;
    return mapRowToEntity(res.rows[0]);
  }

  async deleteByExpenseId(expenseId) {
    if (!expenseId) return 0;
    const res = await db.query(
      `DELETE FROM public.shared_expense_splits WHERE shared_expense_id::text = $1::text;`,
      [String(expenseId)]
    );
    return res.rowCount;
  }

  async deleteByTripId(tripId) {
    if (!tripId) return 0;
    const res = await db.query(
      `DELETE FROM public.shared_expense_splits ses
       USING public.shared_expenses se
       WHERE ses.shared_expense_id = se.id AND se.trip_id::text = $1::text;`,
      [String(tripId)]
    );
    return res.rowCount;
  }
}

module.exports = new SharedExpenseSplitRepository();
