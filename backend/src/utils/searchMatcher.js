/**
 * Reusable search matching and relevance scoring functions.
 */

const normalize = (str) => (str ? String(str).toLowerCase().trim() : '');

const matchesQuery = (targetText, query) => {
  if (!query) return true;
  const q = normalize(query);
  if (!q) return true;
  const t = normalize(targetText);
  return t.includes(q);
};

const calculateRelevanceScore = (targetText, query, popularity = 0) => {
  if (!query) return 1;
  const q = normalize(query);
  const t = normalize(targetText);

  if (!t || !q) return 0;

  let score = 0;

  // Exact Match: 100 points
  if (t === q) {
    score += 100;
  }
  // Starts with Query: 50 points
  else if (t.startsWith(q)) {
    score += 50;
  }
  // Word Boundary Match (any word starts with query): 30 points
  else if (t.split(/[\s,.-]+/).some((w) => w.startsWith(q))) {
    score += 30;
  }
  // Substring Match: 15 points
  else if (t.includes(q)) {
    score += 15;
  }

  // Popularity bonus (0 to 10 points based on popularity 0-100)
  if (popularity > 0) {
    score += Math.min(10, Math.round(popularity / 10));
  }

  return score;
};

const filterNumericRange = (val, min, max) => {
  if (val === undefined || val === null) return true;
  const num = Number(val);
  if (min !== undefined && min !== null && num < Number(min)) return false;
  if (max !== undefined && max !== null && num > Number(max)) return false;
  return true;
};

const filterDateRange = (targetDate, startDate, endDate) => {
  if (!targetDate) return true;
  const d = String(targetDate).substring(0, 10);
  if (startDate && d < startDate) return false;
  if (endDate && d > endDate) return false;
  return true;
};

module.exports = {
  normalize,
  matchesQuery,
  calculateRelevanceScore,
  filterNumericRange,
  filterDateRange
};
