const db = require('../config/database');
const { mapRowToEntity, mapRowsToEntities } = require('../utils/dbHelper');
const { parsePagination } = require('../utils/pagination');

class UserRepository {
  async findById(id) {
    if (!id) return null;
    const res = await db.query(
      `SELECT p.*, u.encrypted_password AS password
       FROM public.profiles p
       LEFT JOIN auth.users u ON u.id = p.id
       WHERE p.id::text = $1::text;`,
      [String(id)]
    );
    if (!res.rows[0]) return null;
    return mapRowToEntity(res.rows[0]);
  }

  async findByEmail(email) {
    if (!email) return null;
    const res = await db.query(
      `SELECT p.*, u.encrypted_password AS password
       FROM public.profiles p
       LEFT JOIN auth.users u ON u.id = p.id
       WHERE LOWER(p.email) = LOWER($1);`,
      [email.trim()]
    );
    if (!res.rows[0]) return null;
    return mapRowToEntity(res.rows[0]);
  }

  async findAll(query = {}) {
    const params = [];
    const conditions = [];

    if (query.search) {
      params.push(`%${query.search.trim().toLowerCase()}%`);
      const pIdx = params.length;
      conditions.push(`(LOWER(p.email) LIKE $${pIdx} OR LOWER(p.first_name) LIKE $${pIdx} OR LOWER(p.last_name) LIKE $${pIdx})`);
    }

    if (query.role) {
      params.push(query.role.toLowerCase());
      conditions.push(`LOWER(p.role) = $${params.length}`);
    }

    if (query.isBlocked !== undefined && query.isBlocked !== null && query.isBlocked !== '') {
      const blockedBool = String(query.isBlocked) === 'true';
      params.push(!blockedBool);
      conditions.push(`p.is_active = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(`SELECT COUNT(*) FROM public.profiles p ${whereClause};`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const { page, limit, offset } = parsePagination(query);

    params.push(limit, offset);
    const sql = `
      SELECT p.*
      FROM public.profiles p
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length};
    `;

    const res = await db.query(sql, params);
    const users = mapRowsToEntities(res.rows);

    return {
      users: users.map(u => {
        const { password, ...safe } = u;
        return safe;
      }),
      total,
      page,
      limit
    };
  }

  async create(userData) {
    let firstName = userData.firstName ? userData.firstName.trim() : '';
    let lastName = userData.lastName ? userData.lastName.trim() : '';
    if (!firstName && userData.name) {
      const parts = userData.name.trim().split(' ');
      firstName = parts[0] || 'Traveler';
      lastName = parts.slice(1).join(' ') || '';
    }
    if (!firstName) firstName = 'Traveler';

    const email = userData.email.toLowerCase().trim();
    const role = (userData.role || 'user').toLowerCase();
    const passwordHash = userData.password || '';

    // Insert into auth.users (trigger handle_new_user creates profile)
    const authRes = await db.query(
      `INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_user_meta_data,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        $1,
        $2,
        now(),
        $3::jsonb,
        now(),
        now()
      )
      RETURNING id, email;`,
      [
        email,
        passwordHash,
        JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone_number: userData.phone || null,
          city: userData.city || null,
          country: userData.country || null,
          bio: userData.bio || null,
          avatar_url: userData.profilePhoto || null,
          role
        })
      ]
    );

    const userId = authRes.rows[0].id;

    // Update profile record with remaining fields
    await db.query(
      `UPDATE public.profiles
       SET
         first_name = $1,
         last_name = $2,
         phone_number = $3,
         city = $4,
         country = $5,
         bio = $6,
         avatar_url = $7,
         home_currency = $8,
         additional_info = $9,
         role = $10,
         updated_at = now()
       WHERE id = $11;`,
      [
        firstName,
        lastName,
        userData.phone || null,
        userData.city || null,
        userData.country || null,
        userData.bio || null,
        userData.profilePhoto || null,
        userData.homeCurrency || 'USD',
        userData.additionalInfo || null,
        role,
        userId
      ]
    );

    return this.findById(userId);
  }

  async update(id, updateData) {
    const existing = await this.findById(id);
    if (!existing) return null;

    let firstName = updateData.firstName !== undefined ? updateData.firstName.trim() : existing.firstName;
    let lastName = updateData.lastName !== undefined ? updateData.lastName.trim() : existing.lastName;

    if (updateData.name && updateData.firstName === undefined) {
      const parts = updateData.name.trim().split(' ');
      firstName = parts[0] || 'Traveler';
      lastName = parts.slice(1).join(' ') || '';
    }

    const updates = [];
    const params = [];

    if (firstName !== undefined) {
      params.push(firstName);
      updates.push(`first_name = $${params.length}`);
    }
    if (lastName !== undefined) {
      params.push(lastName);
      updates.push(`last_name = $${params.length}`);
    }
    if (updateData.phone !== undefined) {
      params.push(updateData.phone);
      updates.push(`phone_number = $${params.length}`);
    }
    if (updateData.city !== undefined) {
      params.push(updateData.city);
      updates.push(`city = $${params.length}`);
    }
    if (updateData.country !== undefined) {
      params.push(updateData.country);
      updates.push(`country = $${params.length}`);
    }
    if (updateData.bio !== undefined) {
      params.push(updateData.bio);
      updates.push(`bio = $${params.length}`);
    }
    if (updateData.profilePhoto !== undefined) {
      params.push(updateData.profilePhoto);
      updates.push(`avatar_url = $${params.length}`);
    }
    if (updateData.homeCurrency !== undefined) {
      params.push(updateData.homeCurrency);
      updates.push(`home_currency = $${params.length}`);
    }
    if (updateData.additionalInfo !== undefined) {
      params.push(updateData.additionalInfo);
      updates.push(`additional_info = $${params.length}`);
    }
    if (updateData.preferences !== undefined) {
      params.push(JSON.stringify(updateData.preferences));
      updates.push(`preferences = $${params.length}::jsonb`);
    }
    if (updateData.isBlocked !== undefined) {
      params.push(!Boolean(updateData.isBlocked));
      updates.push(`is_active = $${params.length}`);
    }
    if (updateData.role !== undefined && updateData.allowRoleChange) {
      params.push(updateData.role.toLowerCase());
      updates.push(`role = $${params.length}`);
    }

    if (updates.length === 0) return existing;

    updates.push(`updated_at = now()`);
    params.push(String(id));

    await db.query(
      `UPDATE public.profiles
       SET ${updates.join(', ')}
       WHERE id::text = $${params.length}::text;`,
      params
    );

    const user = await this.findById(id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async getPreferences(userId) {
    if (!userId) return { interests: [], preferredCountries: [], budgetLevel: 'MEDIUM' };
    const user = await this.findById(userId);
    if (!user) return { interests: [], preferredCountries: [], budgetLevel: 'MEDIUM' };
    return user.preferences || { interests: [], preferredCountries: [], budgetLevel: 'MEDIUM' };
  }

  async updatePreferences(userId, preferences) {
    const updated = await this.update(userId, { preferences });
    return updated?.preferences || preferences;
  }

  async delete(id) {
    if (!id) return false;
    const res = await db.query(`DELETE FROM auth.users WHERE id::text = $1::text RETURNING id;`, [String(id)]);
    return res.rowCount > 0;
  }
}

module.exports = new UserRepository();
