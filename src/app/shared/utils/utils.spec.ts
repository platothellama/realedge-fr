import { describe, expect, it } from 'vitest';
import {
  escapeCsvCell,
  formatCompactCurrency,
  formatDateMed,
  formatMoney,
  formatMoneyUSD,
} from './format';
import { getStatusBadgeClass } from './status';

describe('shared utils (consolidated pure helpers)', () => {
  it('formats compact currency like the dashboard', () => {
    expect(formatCompactCurrency(undefined)).toBe('$0');
    expect(formatCompactCurrency(1500000)).toBe('$1.5M');
    expect(formatCompactCurrency(45000)).toBe('$45K');
    expect(formatCompactCurrency(500)).toBe('$500');
  });

  it('formats exact USD money', () => {
    expect(formatMoneyUSD(12500)).toBe('$12,500');
  });

  it('never renders NaN and supports LBP', () => {
    expect(formatMoney(NaN)).toBe('—');
    expect(formatMoney(1000, 'LBP')).toContain('LBP');
    expect(formatMoney(1000)).toBe('$1,000');
  });

  it('formats medium dates', () => {
    expect(formatDateMed('2026-01-05')).toContain('2026');
  });

  it('escapes CSV cells with formula-injection guard', () => {
    expect(escapeCsvCell('=cmd')).toBe("'=cmd");
    expect(escapeCsvCell('a"b')).toBe('"a""b"');
    expect(escapeCsvCell(null)).toBe('');
  });

  it('maps known statuses and falls back to badge-primary', () => {
    expect(getStatusBadgeClass('Available')).toBe('badge-success');
    expect(getStatusBadgeClass('Nope')).toBe('badge-primary');
  });
});
