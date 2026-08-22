const db = require('../config/database');
const { mapRowToEntity, mapRowsToEntities } = require('../utils/dbHelper');

class PreparationTaskRepository {
  async create(data) {
    const res = await db.query(
      `INSERT INTO public.preparation_tasks (
        trip_id,
        user_id,
        title,
        description,
        category,
        priority,
        status,
        due_date
      ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;`,
      [
        data.tripId,
        data.userId || null,
        data.title.trim(),
        data.description || null,
        (data.category || 'GENERAL').toUpperCase(),
        (data.priority || 'MEDIUM').toUpperCase(),
        (data.status || 'PENDING').toUpperCase(),
        data.dueDate || null
      ]
    );

    return mapRowToEntity(res.rows[0]);
  }

  async findById(id) {
    if (!id) return null;
    const res = await db.query(
      `SELECT * FROM public.preparation_tasks WHERE id::text = $1::text;`,
      [String(id)]
    );
    if (!res.rows[0]) return null;
    return mapRowToEntity(res.rows[0]);
  }

  async findByTripId(tripId, query = {}) {
    const params = [String(tripId)];
    const conditions = [`trip_id::text = $1::text`];

    if (query.status) {
      params.push(query.status.toUpperCase());
      conditions.push(`status = $${params.length}`);
    }

    if (query.priority) {
      params.push(query.priority.toUpperCase());
      conditions.push(`priority = $${params.length}`);
    }

    if (query.category) {
      params.push(query.category.toUpperCase());
      conditions.push(`category = $${params.length}`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const res = await db.query(
      `SELECT pt.*, p.first_name, p.last_name
       FROM public.preparation_tasks pt
       LEFT JOIN public.profiles p ON p.id = pt.user_id
       ${whereClause}
       ORDER BY due_date ASC NULLS LAST, created_at ASC;`,
      params
    );

    return mapRowsToEntities(res.rows).map(task => {
      if (task.firstName) {
        task.assignee = {
          id: task.userId,
          name: `${task.firstName} ${task.lastName || ''}`.trim()
        };
      }
      return task;
    });
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
    if (data.description !== undefined) {
      params.push(data.description);
      updates.push(`description = $${params.length}`);
    }
    if (data.category !== undefined) {
      params.push(data.category.toUpperCase());
      updates.push(`category = $${params.length}`);
    }
    if (data.priority !== undefined) {
      params.push(data.priority.toUpperCase());
      updates.push(`priority = $${params.length}`);
    }
    if (data.status !== undefined || data.isCompleted !== undefined) {
      const status = data.status ? data.status.toUpperCase() : (data.isCompleted ? 'COMPLETED' : 'PENDING');
      params.push(status);
      updates.push(`status = $${params.length}`);
      if (status === 'COMPLETED') {
        updates.push(`completed_at = now()`);
      } else {
        updates.push(`completed_at = null`);
      }
    }
    if (data.dueDate !== undefined) {
      params.push(data.dueDate);
      updates.push(`due_date = $${params.length}`);
    }
    if (data.userId !== undefined) {
      params.push(data.userId ? String(data.userId) : null);
      updates.push(`user_id = $${params.length}::uuid`);
    }

    if (updates.length === 0) return existing;

    updates.push(`updated_at = now()`);
    params.push(String(id));

    const res = await db.query(
      `UPDATE public.preparation_tasks
       SET ${updates.join(', ')}
       WHERE id::text = $${params.length}::text
       RETURNING *;`,
      params
    );

    return mapRowToEntity(res.rows[0]);
  }

  async delete(id) {
    if (!id) return false;
    const res = await db.query(
      `DELETE FROM public.preparation_tasks WHERE id::text = $1::text RETURNING id;`,
      [String(id)]
    );
    return res.rowCount > 0;
  }

  async deleteByTripId(tripId) {
    if (!tripId) return 0;
    const res = await db.query(
      `DELETE FROM public.preparation_tasks WHERE trip_id::text = $1::text;`,
      [String(tripId)]
    );
    return res.rowCount;
  }
}

module.exports = new PreparationTaskRepository();
