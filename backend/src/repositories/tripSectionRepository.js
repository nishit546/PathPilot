const db = require('../config/database');
const { mapRowToEntity, mapRowsToEntities } = require('../utils/dbHelper');

class TripSectionRepository {
  async findById(id) {
    if (!id) return null;
    const res = await db.query(
      `SELECT s.*, c.name AS city_name, c.country AS city_country, c.image_url AS city_image
       FROM public.trip_sections s
       LEFT JOIN public.cities c ON c.id = s.city_id
       WHERE s.id::text = $1::text;`,
      [String(id)]
    );
    if (!res.rows[0]) return null;
    const section = mapRowToEntity(res.rows[0]);
    if (res.rows[0].city_name) {
      section.city = {
        id: section.cityId,
        name: res.rows[0].city_name,
        country: res.rows[0].city_country,
        imageUrl: res.rows[0].city_image
      };
    }
    return section;
  }

  async findByTripId(tripId) {
    if (!tripId) return [];
    const res = await db.query(
      `SELECT s.*, c.name AS city_name, c.country AS city_country, c.image_url AS city_image
       FROM public.trip_sections s
       LEFT JOIN public.cities c ON c.id = s.city_id
       WHERE s.trip_id::text = $1::text
       ORDER BY s.section_order ASC, s.start_date ASC;`,
      [String(tripId)]
    );
    return mapRowsToEntities(res.rows).map(s => {
      if (s.cityName) {
        s.city = {
          id: s.cityId,
          name: s.cityName,
          country: s.cityCountry,
          imageUrl: s.cityImage
        };
      }
      return s;
    });
  }

  async create(data) {
    // Determine section order if not provided
    let sectionOrder = data.order || data.sectionOrder;
    if (!sectionOrder) {
      const maxRes = await db.query(
        `SELECT COALESCE(MAX(section_order), 0) + 1 AS next_order
         FROM public.trip_sections
         WHERE trip_id = $1::uuid;`,
        [data.tripId]
      );
      sectionOrder = maxRes.rows[0].next_order;
    }

    const budget = data.budget !== undefined ? Number(data.budget) : (data.sectionBudget !== undefined ? Number(data.sectionBudget) : 0);

    const res = await db.query(
      `INSERT INTO public.trip_sections (
        trip_id,
        city_id,
        section_order,
        start_date,
        end_date,
        section_budget,
        budget,
        notes
      ) VALUES ($1::uuid, $2::uuid, $3, $4::date, $5::date, $6, $6, $7)
      RETURNING *;`,
      [
        data.tripId,
        data.cityId,
        sectionOrder,
        data.startDate,
        data.endDate,
        budget,
        data.notes || null
      ]
    );

    return mapRowToEntity(res.rows[0]);
  }

  async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates = [];
    const params = [];

    if (data.cityId !== undefined) {
      params.push(data.cityId);
      updates.push(`city_id = $${params.length}::uuid`);
    }
    if (data.order !== undefined || data.sectionOrder !== undefined) {
      const ord = Number(data.order || data.sectionOrder);
      params.push(ord);
      updates.push(`section_order = $${params.length}`);
    }
    if (data.startDate !== undefined) {
      params.push(data.startDate);
      updates.push(`start_date = $${params.length}::date`);
    }
    if (data.endDate !== undefined) {
      params.push(data.endDate);
      updates.push(`end_date = $${params.length}::date`);
    }
    if (data.budget !== undefined || data.sectionBudget !== undefined) {
      const budget = data.budget !== undefined ? Number(data.budget) : Number(data.sectionBudget);
      params.push(budget);
      updates.push(`section_budget = $${params.length}`);
      updates.push(`budget = $${params.length}`);
    }
    if (data.notes !== undefined) {
      params.push(data.notes);
      updates.push(`notes = $${params.length}`);
    }

    if (updates.length === 0) return existing;

    updates.push(`updated_at = now()`);
    params.push(id);

    const res = await db.query(
      `UPDATE public.trip_sections
       SET ${updates.join(', ')}
       WHERE id::text = $${params.length}::text
       RETURNING *;`,
      params
    );

    return mapRowToEntity(res.rows[0]);
  }

  async delete(id) {
    if (!id) return false;
    const res = await db.query(`DELETE FROM public.trip_sections WHERE id::text = $1::text RETURNING id;`, [String(id)]);
    return res.rowCount > 0;
  }

  async deleteByTripId(tripId) {
    if (!tripId) return 0;
    const res = await db.query(`DELETE FROM public.trip_sections WHERE trip_id::text = $1::text;`, [String(tripId)]);
    return res.rowCount;
  }

  async reorder(tripId, orderedIds) {
    await db.transaction(async (client) => {
      // First update to a very large temporary offset to avoid unique constraint collisions
      for (let i = 0; i < orderedIds.length; i++) {
        await client.query(
          `UPDATE public.trip_sections
           SET section_order = $1, updated_at = now()
           WHERE id::text = $2::text AND trip_id::text = $3::text;`,
          [100000 + i + 1, String(orderedIds[i]), String(tripId)]
        );
      }
      for (let i = 0; i < orderedIds.length; i++) {
        await client.query(
          `UPDATE public.trip_sections
           SET section_order = $1, updated_at = now()
           WHERE id::text = $2::text AND trip_id::text = $3::text;`,
          [i + 1, String(orderedIds[i]), String(tripId)]
        );
      }
    });
    return this.findByTripId(tripId);
  }
}

module.exports = new TripSectionRepository();
