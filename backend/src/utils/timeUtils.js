const normalizeTime = (value) => {
  if (!value) return null;
  return String(value).slice(0, 5);
};

const toMinutes = (value) => {
  if (!value || !value.includes(':')) return NaN;
  const [hours, minutes] = value.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return NaN;
  return (hours * 60) + minutes;
};

const formatMinutes = (minutes) => {
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mins = String(minutes % 60).padStart(2, '0');
  return `${hours}:${mins}`;
};

const shiftTime = (value, minutesToAdd) => {
  const base = toMinutes(normalizeTime(value));
  if (!Number.isFinite(base)) return normalizeTime(value);
  const shifted = Math.max(base + minutesToAdd, 0);
  return formatMinutes(shifted);
};

module.exports = { normalizeTime, toMinutes, formatMinutes, shiftTime };
