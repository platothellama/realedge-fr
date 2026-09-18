/**
 * Shared formatting helpers — pure functions consolidated from proven page
 * implementations. Additive only: existing page-local copies are untouched,
 * so current behavior cannot change. New code should import from here.
 */

/** Compact dashboard currency: 1.2M / 45K / $500 (from dashboard.formatCurrency). */
export function formatCompactCurrency(value: number | undefined): string {
  if (!value) return '$0';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}

/** Exact USD money: $12,500 (from invoices.formatCurrency). */
export function formatMoneyUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * NaN-safe money with LBP support; never renders NaN/$NaN.
 * (from invoices.formatCurrencyWithSymbol, incl. QA 2026-09-18 guard).
 */
export function formatMoney(value: number, currency = 'USD'): string {
  const v = Number(value);
  if (!Number.isFinite(v)) return '—';
  if (currency === 'LBP') {
    return (
      new Intl.NumberFormat('en-LB', { style: 'decimal', maximumFractionDigits: 0 }).format(v) +
      ' LBP'
    );
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(v);
}

/** Medium date: Jan 5, 2026 (from invoices.formatDate). */
export function formatDateMed(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * RFC4180 cell escaping + spreadsheet formula-injection guard.
 * (exact copy of crm/deals escapeCsvCell, incl. QA 2026-09-18 comment).
 */
export function escapeCsvCell(value: unknown): string {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@]/.test(s.trim())) s = `'${s}`;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}
