import { describe, it, expect } from 'vitest';
import { formatCurrency } from '@/lib/format';

describe('formatCurrency', () => {
  it('formats amount using Spanish locale', () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain('€');
    expect(result).toContain(',56');
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
