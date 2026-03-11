/**
 * Format a price/amount for display, rounded to the nearest integer.
 * Returns "—" for invalid or NaN values.
 */
export function formatPrice(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(n)) return '—';
  return String(Math.round(n));
}
