const db = require('../config/database');
const { mapRowToEntity, mapRowsToEntities } = require('../utils/dbHelper');

const mapDayActivity = (item, row) => {
  // Map end_time
  if (row && row.end_time !== undefined) {
    item.endTime = row.end_time ? String(row.end_time).slice(0, 5) : null;
  }
  return item;
};

class DayActivityRepository {
  async findById(id) {
    if (!id) return null;
    const res = await db.query(
      `SELECT da.*, a.name AS activity_name, a.description AS activity_description,
              a.category AS activity_category, a.estimated_cost AS master_cost,
              a.duration_minutes, a.image_url AS activity_image
       FROM public.day_activities da
       LEFT JOIN public.activities a ON a.id = da.activity_id
       WHERE da.id::text = $1::text;`,
      [String(id)]
    );
    if (!res.rows[0]) return null;
    const item = mapDayActivity(mapRowToEntity(res.rows[0]), res.rows[0]);
    if (res.rows[0].activity_name) {
      item.activity = {
        id: item.activityId,
        name: res.rows[0].activity_name,
        description: res.rows[0].activity_description,
        category: res.rows[0].activity_category,
        cost: Number(res.rows[0].master_cost || 0),
        duration: res.rows[0].duration_minutes ? Math.round((Number(res.rows[0].duration_minutes) / 60) * 10) / 10 : 2,
        imageUrl: res.rows[0].activity_image
      };
    }
    return item;
  }

  async findByDayId(dayId) {
    if (!dayId) return [];
    const res = await db.query(
      `SELECT da.*, a.name AS activity_name, a.description AS activity_description,
              a.category AS activity_category, a.estimated_cost AS master_cost,
              a.duration_minutes, a.image_url AS activity_image
       FROM public.day_activities da
       LEFT JOIN public.activities a ON a.id = da.activity_id
       WHERE da.day_id::text = $1::text
       ORDER BY da.activity_order ASC, da.planned_time ASC;`,
      [String(dayId)]
    );
    return res.rows.map((row) => {
      const item = mapDayActivity(mapRowToEntity(row), row);
      if (row.activity_name) {
        item.activity = {
          id: item.activityId,
          name: row.activity_name,
          description: row.activity_description,
          category: row.activity_category,
          cost: Number(row.master_cost || 0),
          duration: row.duration_minutes ? Math.round((Number(row.duration_minutes) / 60) * 10) / 10 : 2,
          imageUrl: row.activity_image
        };
      }
      return item;
    });
  }

  async findByDayIds(dayIds) {
    if (!dayIds || dayIds.length === 0) return [];
    const strDayIds = dayIds.map(String);
    const res = await db.query(
      `SELECT da.*, a.name AS activity_name, a.description AS activity_description,
              a.category AS activity_category, a.estimated_cost AS master_cost,
              a.duration_minutes, a.image_url AS activity_image
       FROM public.day_activities da
       LEFT JOIN public.activities a ON a.id = da.activity_id
       WHERE da.day_id::text = ANY($1::text[])
       ORDER BY da.day_id ASC, da.activity_order ASC, da.planned_time ASC;`,
      [strDayIds]
    );
    return res.rows.map((row) => {
      const item = mapDayActivity(mapRowToEntity(row), row);
      if (row.activity_name) {
        item.activity = {
          id: item.activityId,
          name: row.activity_name,
          description: row.activity_description,
          category: row.activity_category,
          cost: Number(row.master_cost || 0),
          duration: row.duration_minutes ? Math.round((Number(row.duration_minutes) / 60) * 10) / 10 : 2,
          imageUrl: row.activity_image
        };
      }
      return item;
    });
  }

  async create(data) {
    let order = data.order || data.activityOrder;
    if (!order) {
      const maxRes = await db.query(
        `SELECT COALESCE(MAX(activity_order), 0) + 1 AS next_order
         FROM public.day_activities
         WHERE day_id::text = $1::text;`,
        [String(data.dayId)]
      );
      order = maxRes.rows[0].next_order;
    }

    const cost = data.customCost !== undefined ? (data.customCost !== null ? Number(data.customCost) : null) : (data.cost !== undefined ? Number(data.cost) : null);
    const plannedTime = data.startTime || data.plannedTime || null;
    const endTime = data.endTime || null;

    const res = await db.query(
      `INSERT INTO public.day_activities (
        day_id,
        activity_id,
        activity_order,
        planned_time,
        end_time,
        notes,
        expense_amount
      ) VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7)
      RETURNING *;`,
      [
        data.dayId,
        data.activityId,
        order,
        plannedTime,
        endTime,
        data.notes || null,
        cost
      ]
    );

    return this.findById(res.rows[0].id);
  }

  async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates = [];
    const params = [];

    if (data.order !== undefined || data.activityOrder !== undefined) {
      const ord = Number(data.order || data.activityOrder);
      params.push(ord);
      updates.push(`activity_order = $${params.length}`);
    }
    if (data.startTime !== undefined || data.plannedTime !== undefined) {
      const t = data.startTime || data.plannedTime;
      params.push(t);
      updates.push(`planned_time = $${params.length}`);
    }
    if (data.endTime !== undefined) {
      params.push(data.endTime || null);
      updates.push(`end_time = $${params.length}`);
    }
    if (data.customCost !== undefined || data.cost !== undefined) {
      const cost = data.customCost !== undefined ? (data.customCost !== null ? Number(data.customCost) : null) : (data.cost !== null ? Number(data.cost) : null);
      params.push(cost);
      updates.push(`expense_amount = $${params.length}`);
    }
    if (data.notes !== undefined) {
      params.push(data.notes);
      updates.push(`notes = $${params.length}`);
    }

    if (updates.length === 0) return existing;

    updates.push(`updated_at = now()`);
    params.push(String(id));

    await db.query(
      `UPDATE public.day_activities
       SET ${updates.join(', ')}
       WHERE id::text = $${params.length}::text;`,
      params
    );

    return this.findById(id);
  }

  async delete(id) {
    if (!id) return false;
    const res = await db.query(`DELETE FROM public.day_activities WHERE id::text = $1::text RETURNING id;`, [String(id)]);
    return res.rowCount > 0;
  }

  async deleteByDayId(dayId) {
    if (!dayId) return 0;
    const res = await db.query(`DELETE FROM public.day_activities WHERE day_id::text = $1::text;`, [String(dayId)]);
    return res.rowCount;
  }

  async deleteByTripId(tripId) {
    if (!tripId) return 0;
    const res = await db.query(
      `DELETE FROM public.day_activities da
       USING public.days d, public.trip_sections s
       WHERE da.day_id = d.id AND d.section_id = s.id AND s.trip_id::text = $1::text;`,
      [String(tripId)]
    );
    return res.rowCount;
  }

  async reorder(dayId, orderedIds) {
    await db.transaction(async (client) => {
      // First update to temporary offset to avoid unique constraint collisions
      for (let i = 0; i < orderedIds.length; i++) {
        await client.query(
          `UPDATE public.day_activities
           SET activity_order = $1, updated_at = now()
           WHERE id::text = $2::text AND day_id::text = $3::text;`,
          [1000 + i + 1, String(orderedIds[i]), String(dayId)]
        );
      }
      for (let i = 0; i < orderedIds.length; i++) {
        await client.query(
          `UPDATE public.day_activities
           SET activity_order = $1, updated_at = now()
           WHERE id::text = $2::text AND day_id::text = $3::text;`,
          [i + 1, String(orderedIds[i]), String(dayId)]
        );
      }
    });
    return this.findByDayId(dayId);
  }
}

module.exports = new DayActivityRepository();
