export const shortId = (value, visible = 8) => {
  if (!value || typeof value !== 'string') return 'N/A';
  if (value.length <= visible * 2 + 3) return value;
  return `${value.slice(0, visible)}...${value.slice(-visible)}`;
};

const safeUpper = (value) => (value || '').toString().toUpperCase();

const initials = (value, fallback = 'GEN') => {
  const text = (value || '').toString().trim();
  if (!text) return fallback;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 1) return safeUpper(words[0].slice(0, 3)).padEnd(3, 'X').slice(0, 3);
  return safeUpper(words.map((w) => w[0]).join('').slice(0, 3)).padEnd(3, 'X').slice(0, 3);
};

const numericFromValue = (value, width = 4) => {
  if (!value) return ''.padStart(width, '0');
  const digits = String(value).replace(/\D/g, '');
  if (digits.length >= width) return digits.slice(-width);

  const hex = String(value).replace(/-/g, '').slice(-8);
  const parsed = Number.parseInt(hex, 16);
  if (!Number.isNaN(parsed)) {
    const mod = 10 ** width;
    return String(parsed % mod).padStart(width, '0');
  }

  let hash = 0;
  for (const char of String(value)) {
    hash = ((hash << 5) - hash) + char.charCodeAt(0);
    hash |= 0;
  }
  return String(Math.abs(hash) % (10 ** width)).padStart(width, '0');
};

const patientNumberFromRecord = (record, fallbackValue) => {
  const email = record?.email || '';
  const emailNumber = email.match(/(\d{3,6})(?=@)/)?.[1];
  if (emailNumber) return emailNumber;
  return numericFromValue(fallbackValue, 4);
};

const dateToken = (value) => {
  if (!value) return 'NA';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'NA';
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
};

export const readableId = (entity, value, record = {}) => {
  if (!value) return 'N/A';

  const kind = (entity || 'GEN').toLowerCase();
  const deptCode = initials(record?.department?.name || record?.departmentName || record?.ward?.department?.name || 'GEN');

  if (kind === 'patient') {
    return `PAT-${deptCode}-${patientNumberFromRecord(record, value)}`;
  }

  if (kind === 'doctor') {
    const doctorCode = numericFromValue(record?.licenseNumber || value, 4);
    return `DOC-${deptCode}-${doctorCode}`;
  }

  if (kind === 'appointment') {
    return `APT-${dateToken(record?.appointmentDate)}-${numericFromValue(value, 4)}`;
  }

  if (kind === 'department') {
    return `DPT-${initials(record?.name || record?.departmentName || 'DEP')}-${numericFromValue(value, 3)}`;
  }

  if (kind === 'bill') return `BIL-${numericFromValue(value, 5)}`;
  if (kind === 'insurance') return `INS-${numericFromValue(value, 5)}`;
  if (kind === 'ehr') return `EHR-${numericFromValue(value, 5)}`;
  if (kind === 'laboratory' || kind === 'lab') return `LAB-${numericFromValue(value, 5)}`;
  if (kind === 'prescription') return `RX-${numericFromValue(value, 5)}`;
  if (kind === 'ward') return `WRD-${numericFromValue(value, 4)}`;
  if (kind === 'bed') return `BED-${numericFromValue(value, 4)}`;
  if (kind === 'admission') return `ADM-${numericFromValue(value, 4)}`;

  return `${safeUpper(kind.slice(0, 3) || 'ID')}-${numericFromValue(value, 4)}`;
};
