const db = require('../config/database');
const { mapRowToEntity, mapRowsToEntities } = require('../utils/dbHelper');

class DayRepository {
  async findById(id) {
    if (!id) return null;
    const res = await db.query(
      `SELECT d.*, s.trip_id
       FROM public.days d
       LEFT JOIN public.trip_sections s ON s.id = d.section_id
       WHERE d.id::text = $1::text;`,
      [String(id)]
    );
    if (!res.rows[0]) return null;
    return mapRowToEntity(res.rows[0]);
  }

  async findBySectionId(sectionId) {
    if (!sectionId) return [];
    const res = await db.query(
      `SELECT d.*, s.trip_id
       FROM public.days d
       LEFT JOIN public.trip_sections s ON s.id = d.section_id
       WHERE d.section_id::text = $1::text
       ORDER BY d.day_number ASC, d.date ASC;`,
      [String(sectionId)]
    );
    return mapRowsToEntities(res.rows);
  }

  async findByTripId(tripId) {
    if (!tripId) return [];
    const res = await db.query(
      `SELECT d.*, s.trip_id, s.city_id, c.name AS city_name
       FROM public.days d
       JOIN public.trip_sections s ON s.id = d.section_id
       LEFT JOIN public.cities c ON c.id = s.city_id
       WHERE s.trip_id::text = $1::text
       ORDER BY s.section_order ASC, d.day_number ASC, d.date ASC;`,
      [String(tripId)]
    );
    return mapRowsToEntities(res.rows);
  }

  async create(data) {
    const res = await db.query(
      `INSERT INTO public.days (
        section_id,
        date,
        day_number,
        notes
      ) VALUES ($1::uuid, $2::date, $3, $4)
      RETURNING *;`,
      [
        data.sectionId,
        data.date,
        data.dayNumber || 1,
        data.notes || null
      ]
    );

    return mapRowToEntity(res.rows[0]);
  }

  async createBulk(daysData) {
    if (!daysData || daysData.length === 0) return [];

    return await db.transaction(async (client) => {
      const createdDays = [];
      for (const d of daysData) {
        const res = await client.query(
          `INSERT INTO public.days (
            section_id,
            date,
            day_number,
            notes
          ) VALUES ($1::uuid, $2::date, $3, $4)
          RETURNING *;`,
          [
            d.sectionId,
            d.date,
            d.dayNumber || 1,
            d.notes || null
          ]
        );
        createdDays.push(mapRowToEntity(res.rows[0]));
      }
      return createdDays;
    });
  }

  async delete(id) {
    if (!id) return false;
    const res = await db.query(`DELETE FROM public.days WHERE id::text = $1::text RETURNING id;`, [String(id)]);
    return res.rowCount > 0;
  }

  async deleteBySectionId(sectionId) {
    if (!sectionId) return 0;
    const res = await db.query(`DELETE FROM public.days WHERE section_id::text = $1::text;`, [String(sectionId)]);
    return res.rowCount;
  }

  async deleteByTripId(tripId) {
    if (!tripId) return 0;
    const res = await db.query(
      `DELETE FROM public.days d
       USING public.trip_sections s
       WHERE d.section_id = s.id AND s.trip_id::text = $1::text;`,
      [String(tripId)]
    );
    return res.rowCount;
  }
}

module.exports = new DayRepository();
