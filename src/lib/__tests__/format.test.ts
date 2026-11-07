import { describe, it, expect } from 'vitest';
import { formatCurrency } from '@/lib/format';

describe('formatCurrency', () => {
  it('formats amount using Spanish locale with thousands separator', () => {
    const result = formatCurrency(1234.56);
    expect(result).toBe('1.234,56\u00a0€');
  });

  it('groups four-digit amounts even though es-ES omits grouping by default', () => {
    expect(formatCurrency(2500)).toBe('2.500,00\u00a0€');
    expect(formatCurrency(2373.05)).toBe('2.373,05\u00a0€');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('0,00\u00a0€');
  });

  it('formats negative amount', () => {
    const result = formatCurrency(-50.5);
    expect(result).toContain('-');
    expect(result).toContain('€');
  });
});
