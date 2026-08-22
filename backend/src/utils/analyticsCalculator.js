const getDateRange = (startDateStr, endDateStr) => {
  const dates = [];
  const current = new Date(startDateStr);
  const end = new Date(endDateStr);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
};

const getTripStatus = (startDate, endDate) => {
  const today = new Date().toISOString().split('T')[0];
  if (endDate < today) return 'COMPLETED';
  if (startDate > today) return 'UPCOMING';
  return 'ONGOING';
};

const getDurationInDays = (startDate, endDate) => {
  return getDateRange(startDate, endDate).length;
};

module.exports = {
  getDateRange,
  getTripStatus,
  getDurationInDays
};
