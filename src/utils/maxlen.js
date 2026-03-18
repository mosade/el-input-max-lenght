export function normalizeValue(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

export function enforceMaxLen(value, limit) {
  const normalized = normalizeValue(value);
  const safeLimit = Number.isFinite(limit) ? limit : 4000;
  if (normalized.length <= safeLimit) {
    return { value: normalized, truncated: false };
  }
  return { value: normalized.slice(0, safeLimit), truncated: true };
}