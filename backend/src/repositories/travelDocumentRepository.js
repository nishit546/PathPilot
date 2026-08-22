const db = require('../config/database');
const { mapRowToEntity, mapRowsToEntities } = require('../utils/dbHelper');

class TravelDocumentRepository {
  async create(data) {
    const docType = (data.documentType || data.type || 'OTHER').toUpperCase();
    const title = (data.title || data.name || 'Travel Document').trim();
    const isReady = data.isReady !== undefined ? Boolean(data.isReady) : Boolean(data.isVerified);

    const res = await db.query(
      `INSERT INTO public.travel_documents (
        trip_id,
        user_id,
        document_type,
        title,
        file_url,
        expiry_date,
        is_verified,
        notes
      ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;`,
      [
        data.tripId,
        data.userId || null,
        docType,
        title,
        data.fileUrl || data.file_url || null,
        data.expiryDate || null,
        isReady,
        data.notes || null
      ]
    );

    return mapRowToEntity(res.rows[0]);
  }

  async findById(id) {
    if (!id) return null;
    const res = await db.query(
      `SELECT * FROM public.travel_documents WHERE id::text = $1::text;`,
      [String(id)]
    );
    if (!res.rows[0]) return null;
    return mapRowToEntity(res.rows[0]);
  }

  async findByTripId(tripId) {
    if (!tripId) return [];
    const res = await db.query(
      `SELECT td.*, p.first_name, p.last_name
       FROM public.travel_documents td
       LEFT JOIN public.profiles p ON p.id = td.user_id
       WHERE td.trip_id::text = $1::text
       ORDER BY td.created_at ASC;`,
      [String(tripId)]
    );
    return mapRowsToEntities(res.rows).map(doc => {
      if (doc.firstName) {
        doc.user = {
          id: doc.userId,
          name: `${doc.firstName} ${doc.lastName || ''}`.trim()
        };
      }
      return doc;
    });
  }

  async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates = [];
    const params = [];

    if (data.title !== undefined || data.name !== undefined) {
      params.push((data.title || data.name).trim());
      updates.push(`title = $${params.length}`);
    }
    if (data.documentType !== undefined || data.type !== undefined) {
      params.push((data.documentType || data.type).toUpperCase());
      updates.push(`document_type = $${params.length}`);
    }
    if (data.fileUrl !== undefined || data.file_url !== undefined) {
      params.push(data.fileUrl || data.file_url);
      updates.push(`file_url = $${params.length}`);
    }
    if (data.expiryDate !== undefined) {
      params.push(data.expiryDate);
      updates.push(`expiry_date = $${params.length}`);
    }
    if (data.isVerified !== undefined || data.isReady !== undefined) {
      const isReady = data.isReady !== undefined ? Boolean(data.isReady) : Boolean(data.isVerified);
      params.push(isReady);
      updates.push(`is_verified = $${params.length}`);
    }
    if (data.notes !== undefined) {
      params.push(data.notes);
      updates.push(`notes = $${params.length}`);
    }

    if (updates.length === 0) return existing;

    updates.push(`updated_at = now()`);
    params.push(String(id));

    const res = await db.query(
      `UPDATE public.travel_documents
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
      `DELETE FROM public.travel_documents WHERE id::text = $1::text RETURNING id;`,
      [String(id)]
    );
    return res.rowCount > 0;
  }

  async deleteByTripId(tripId) {
    if (!tripId) return 0;
    const res = await db.query(
      `DELETE FROM public.travel_documents WHERE trip_id::text = $1::text;`,
      [String(tripId)]
    );
    return res.rowCount;
  }
}

module.exports = new TravelDocumentRepository();
