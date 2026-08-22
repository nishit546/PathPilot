const db = require('../config/database');
const { mapRowToEntity, mapRowsToEntities } = require('../utils/dbHelper');

class TripCollaboratorRepository {
  async findByTripId(tripId) {
    if (!tripId) return [];
    const res = await db.query(
      `SELECT tc.*, p.first_name, p.last_name, p.email, p.avatar_url
       FROM public.trip_collaborators tc
       JOIN public.profiles p ON p.id = tc.user_id
       WHERE tc.trip_id::text = $1::text
       ORDER BY tc.created_at ASC;`,
      [String(tripId)]
    );
    return mapRowsToEntities(res.rows).map(c => {
      c.user = {
        id: c.userId,
        name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Collaborator',
        email: c.email,
        profilePhoto: c.avatarUrl
      };
      return c;
    });
  }

  async findByTripAndUser(tripId, userId) {
    return this.findCollaborator(tripId, userId);
  }

  async findCollaborator(tripId, userId) {
    if (!tripId || !userId) return null;
    const res = await db.query(
      `SELECT tc.*, p.first_name, p.last_name, p.email
       FROM public.trip_collaborators tc
       JOIN public.profiles p ON p.id = tc.user_id
       WHERE tc.trip_id::text = $1::text AND tc.user_id::text = $2::text;`,
      [String(tripId), String(userId)]
    );
    if (!res.rows[0]) return null;
    const item = mapRowToEntity(res.rows[0]);
    item.user = {
      id: item.userId,
      name: `${item.firstName || ''} ${item.lastName || ''}`.trim(),
      email: item.email
    };
    return item;
  }

  async findByUserId(userId) {
    if (!userId) return [];
    const res = await db.query(
      `SELECT tc.*, t.title AS trip_title
       FROM public.trip_collaborators tc
       JOIN public.trips t ON t.id = tc.trip_id
       WHERE tc.user_id::text = $1::text;`,
      [String(userId)]
    );
    return mapRowsToEntities(res.rows);
  }

  async create(data) {
    const role = (data.role || 'VIEWER').toUpperCase();
    const status = (data.status || 'ACCEPTED').toUpperCase();

    const res = await db.query(
      `INSERT INTO public.trip_collaborators (
        trip_id,
        user_id,
        role,
        status,
        invited_at,
        accepted_at
      ) VALUES ($1::uuid, $2::uuid, $3, $4, now(), now())
      ON CONFLICT (trip_id, user_id) DO UPDATE
      SET role = EXCLUDED.role, status = EXCLUDED.status, updated_at = now()
      RETURNING *;`,
      [data.tripId, data.userId, role, status]
    );

    return this.findCollaborator(data.tripId, data.userId);
  }

  async updateRole(tripId, userId, role) {
    const res = await db.query(
      `UPDATE public.trip_collaborators
       SET role = $1, updated_at = now()
       WHERE trip_id::text = $2::text AND user_id::text = $3::text
       RETURNING *;`,
      [role.toUpperCase(), String(tripId), String(userId)]
    );
    if (!res.rows[0]) return null;
    return this.findCollaborator(tripId, userId);
  }

  async delete(tripId, userId) {
    if (!tripId || !userId) return false;
    const res = await db.query(
      `DELETE FROM public.trip_collaborators
       WHERE trip_id::text = $1::text AND user_id::text = $2::text
       RETURNING id;`,
      [String(tripId), String(userId)]
    );
    return res.rowCount > 0;
  }

  async deleteByTripId(tripId) {
    if (!tripId) return 0;
    const res = await db.query(
      `DELETE FROM public.trip_collaborators WHERE trip_id::text = $1::text;`,
      [String(tripId)]
    );
    return res.rowCount;
  }
}

module.exports = new TripCollaboratorRepository();
