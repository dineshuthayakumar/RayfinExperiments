const integer = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatInt(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : integer.format(value);
}

export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return Math.abs(value) < 10_000 ? integer.format(value) : compact.format(value);
}

export function formatPct(value: number | null | undefined, digits = 1): string {
  return value === null || value === undefined ? '—' : `${value.toFixed(digits)}%`;
}

export function formatScore(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : value.toFixed(1);
}

/** Signed delta in percentage points, e.g. "+1.2 pts". */
export function formatDelta(value: number | null | undefined): string | null {
  if (value === null || value === undefined || Math.abs(value) < 0.05) return null;
  return `${value > 0 ? '+' : '−'}${Math.abs(value).toFixed(1)} pts`;
}

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

export function formatRelative(date: Date | null | undefined, now = new Date()): string {
  if (!date) return '—';
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return relative.format(seconds, 'second');
  if (abs < 3600) return relative.format(Math.round(seconds / 60), 'minute');
  if (abs < 86_400) return relative.format(Math.round(seconds / 3600), 'hour');
  return relative.format(Math.round(seconds / 86_400), 'day');
}

const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});
const shortDate = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

export function formatDateTime(date: Date | null | undefined): string {
  return date ? dateTime.format(date) : '—';
}

export function formatShortDate(date: Date): string {
  return shortDate.format(date);
}

export function formatDuration(start: Date, end: Date | null): string {
  if (!end) return '—';
  const seconds = Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
