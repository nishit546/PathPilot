const db = require('../config/database');
const { mapRowToEntity, mapRowsToEntities } = require('../utils/dbHelper');

class TravelSegmentRepository {
  async create(data) {
    const res = await db.query(
      `INSERT INTO public.travel_segments (
        trip_id,
        from_city_id,
        to_city_id,
        from_city,
        to_city,
        estimated_distance,
        estimated_duration,
        estimated_cost,
        selected_mode,
        recommended_mode
      ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;`,
      [
        data.tripId,
        data.fromCityId || null,
        data.toCityId || null,
        data.fromCity,
        data.toCity,
        Number(data.estimatedDistance || data.distance || 0),
        Number(data.estimatedDuration || data.duration || 0),
        Number(data.estimatedCost || data.cost || 0),
        data.selectedMode || null,
        data.recommendedMode || 'FLIGHT'
      ]
    );

    return mapRowToEntity(res.rows[0]);
  }

  async findById(id) {
    if (!id) return null;
    const res = await db.query(
      `SELECT * FROM public.travel_segments WHERE id::text = $1::text;`,
      [String(id)]
    );
    if (!res.rows[0]) return null;
    return mapRowToEntity(res.rows[0]);
  }

  async findByTripId(tripId) {
    if (!tripId) return [];
    const res = await db.query(
      `SELECT * FROM public.travel_segments WHERE trip_id::text = $1::text ORDER BY created_at ASC;`,
      [String(tripId)]
    );
    return mapRowsToEntities(res.rows);
  }

  async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates = [];
    const params = [];

    if (data.selectedMode !== undefined) {
      params.push(data.selectedMode);
      updates.push(`selected_mode = $${params.length}`);
    }
    if (data.estimatedCost !== undefined || data.cost !== undefined) {
      const cost = data.estimatedCost !== undefined ? Number(data.estimatedCost) : Number(data.cost);
      params.push(cost);
      updates.push(`estimated_cost = $${params.length}`);
    }
    if (data.estimatedDuration !== undefined || data.duration !== undefined) {
      const dur = data.estimatedDuration !== undefined ? Number(data.estimatedDuration) : Number(data.duration);
      params.push(dur);
      updates.push(`estimated_duration = $${params.length}`);
    }

    if (updates.length === 0) return existing;

    updates.push(`updated_at = now()`);
    params.push(String(id));

    const res = await db.query(
      `UPDATE public.travel_segments
       SET ${updates.join(', ')}
       WHERE id::text = $${params.length}::text
       RETURNING *;`,
      params
    );

    return mapRowToEntity(res.rows[0]);
  }

  async deleteByTripId(tripId) {
    if (!tripId) return 0;
    const res = await db.query(
      `DELETE FROM public.travel_segments WHERE trip_id::text = $1::text;`,
      [String(tripId)]
    );
    return res.rowCount;
  }
}

module.exports = new TravelSegmentRepository();
