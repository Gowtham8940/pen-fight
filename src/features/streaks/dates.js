/**
 * Local-day helpers for the streak system. Streaks are measured in *calendar
 * days in the device's local timezone*, so all comparisons go through a
 * "YYYY-MM-DD" key built from local date parts (never UTC/ISO, which would shift
 * the day for users in negative offsets).
 */

export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Whole calendar days from fromKey to toKey (toKey - fromKey). */
export function diffDays(fromKey, toKey) {
  const [fy, fm, fd] = fromKey.split('-').map(Number);
  const [ty, tm, td] = toKey.split('-').map(Number);
  const a = new Date(fy, fm - 1, fd);
  const b = new Date(ty, tm - 1, td);
  return Math.round((b - a) / 86400000);
}

/** The last `n` calendar days ending today, oldest first, as date keys. */
export function lastNDays(n, from = new Date()) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() - i);
    out.push(dateKey(d));
  }
  return out;
}

/** Short weekday label (Mon, Tue…) for a date key, in the current locale. */
export function weekdayShort(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short' });
}
