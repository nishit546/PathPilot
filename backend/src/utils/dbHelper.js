/**
 * Database Row to Entity Object Transformer
 */

const snakeToCamel = (str) => {
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
};

const mapRowToEntity = (row) => {
  if (!row || typeof row !== 'object') return row;

  const entity = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = snakeToCamel(key);
    entity[camelKey] = value;
  }

  // Domain-specific aliases and normalization
  if (row.title !== undefined && entity.name === undefined) {
    entity.name = row.title;
  }
  if (row.name !== undefined && entity.title === undefined) {
    entity.title = row.name;
  }
  if (row.avatar_url !== undefined) {
    entity.profilePhoto = row.avatar_url;
  }
  if (row.phone_number !== undefined) {
    entity.phone = row.phone_number;
  }
  if (row.cover_image_url !== undefined) {
    entity.coverPhoto = row.cover_image_url;
    entity.coverImage = row.cover_image_url;
  }
  if (row.visibility !== undefined && row.visibility !== null) {
    entity.visibility = String(row.visibility).toUpperCase();
    entity.isPublic = entity.visibility === 'PUBLIC';
  }
  if (row.status !== undefined && row.status !== null) {
    entity.status = String(row.status).toUpperCase();
  }
  if (row.overall_budget !== undefined) {
    entity.totalBudget = Number(row.overall_budget || 0);
    entity.budget = Number(row.overall_budget || 0);
  }
  if (row.section_budget !== undefined) {
    entity.budget = Number(row.section_budget || 0);
  }
  if (row.section_order !== undefined) {
    entity.order = Number(row.section_order);
  }
  if (row.activity_order !== undefined) {
    entity.order = Number(row.activity_order);
  }
  if (row.planned_time !== undefined) {
    entity.startTime = row.planned_time ? String(row.planned_time).slice(0, 5) : null;
  }
  if (row.expense_amount !== undefined) {
    entity.customCost = row.expense_amount !== null ? Number(row.expense_amount) : null;
  }
  if (row.duration_minutes !== undefined) {
    entity.duration = row.duration_minutes ? Math.round((Number(row.duration_minutes) / 60) * 10) / 10 : 2;
    entity.durationMinutes = row.duration_minutes;
  }
  if (row.amount !== undefined) {
    entity.amount = Number(row.amount || 0);
  }
  if (row.share_amount !== undefined) {
    entity.shareAmount = Number(row.share_amount || 0);
    entity.amount = Number(row.share_amount || 0);
  }
  if (row.share_percentage !== undefined) {
    entity.sharePercentage = row.share_percentage !== null ? Number(row.share_percentage) : null;
    entity.percentage = row.share_percentage !== null ? Number(row.share_percentage) : null;
  }
  if (row.estimated_cost !== undefined) {
    entity.estimatedCost = Number(row.estimated_cost || 0);
    entity.cost = Number(row.estimated_cost || 0);
  }
  if (row.first_name !== undefined || row.last_name !== undefined) {
    if (!row.name && !row.title) {
      entity.name = `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'User';
    }
    entity.userName = `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'User';
    entity.authorName = `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'User';
  }
  if (row.document_type !== undefined) {
    entity.type = row.document_type;
    entity.documentType = row.document_type;
  }
  if (row.is_verified !== undefined) {
    entity.isReady = Boolean(row.is_verified);
    entity.isVerified = Boolean(row.is_verified);
  }
  if (row.is_active !== undefined) {
    entity.isActive = Boolean(row.is_active);
    entity.isBlocked = !row.is_active;
  }
  if (row.is_blocked !== undefined) {
    entity.isBlocked = Boolean(row.is_blocked);
    entity.isActive = !row.is_blocked;
  }
  if (row.status !== undefined && entity.isCompleted === undefined) {
    entity.isCompleted = String(row.status).toUpperCase() === 'COMPLETED';
  }

  // Notification data unpacking
  if (row.data) {
    let parsedData = row.data;
    if (typeof parsedData === 'string') {
      try { parsedData = JSON.parse(parsedData); } catch (e) {}
    }
    if (parsedData && typeof parsedData === 'object') {
      if (parsedData.relatedTripId !== undefined && entity.relatedTripId === undefined) {
        entity.relatedTripId = parsedData.relatedTripId;
      }
      if (parsedData.relatedUserId !== undefined && entity.relatedUserId === undefined) {
        entity.relatedUserId = parsedData.relatedUserId;
      }
      if (parsedData.metadata !== undefined && entity.metadata === undefined) {
        entity.metadata = parsedData.metadata;
      }
    }
  }

  // Trip Template metadata unpacking
  if (row.sections_data !== undefined) {
    let parsedSec = row.sections_data;
    if (typeof parsedSec === 'string') {
      try { parsedSec = JSON.parse(parsedSec); } catch (e) {}
    }
    entity.sections = parsedSec || [];
    entity.sectionsData = parsedSec || [];
  }
  if (row.estimated_budget !== undefined) {
    entity.estimatedBudget = Number(row.estimated_budget || 0);
  }
  if (row.duration_days !== undefined) {
    entity.durationDays = Number(row.duration_days || 1);
  }
  if (row.copy_count !== undefined) {
    entity.copyCount = Number(row.copy_count || 0);
  }
  if (row.favorite_count !== undefined) {
    entity.favoriteCount = Number(row.favorite_count || 0);
  }
  if (entity.metadata === undefined && (row.estimated_budget !== undefined || row.duration_days !== undefined || row.sections_data !== undefined)) {
    let actCount = 0;
    if (Array.isArray(entity.sections)) {
      entity.sections.forEach(s => {
        if (Array.isArray(s.activities)) actCount += s.activities.length;
      });
    }
    entity.metadata = {
      totalDays: entity.durationDays || 1,
      estimatedCost: entity.estimatedBudget || 0,
      totalActivities: actCount,
      totalCities: Array.isArray(entity.sections) ? entity.sections.length : 0
    };
  }

  const formatDateSafe = (d) => {
    if (!d) return d;
    if (typeof d === 'string') return d.slice(0, 10);
    if (d instanceof Date) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return d;
  };

  if (row.start_date !== undefined) {
    entity.startDate = formatDateSafe(row.start_date);
  }
  if (row.end_date !== undefined) {
    entity.endDate = formatDateSafe(row.end_date);
  }
  if (row.date !== undefined) {
    entity.date = formatDateSafe(row.date);
  }

  return entity;
};

const mapRowsToEntities = (rows) => {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapRowToEntity);
};

module.exports = {
  snakeToCamel,
  mapRowToEntity,
  mapRowsToEntities
};
