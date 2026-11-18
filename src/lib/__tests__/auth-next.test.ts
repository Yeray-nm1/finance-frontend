import { describe, expect, it } from 'vitest';
import { safeRedirectPath } from '../auth-next';

describe('safeRedirectPath', () => {
  it('acepta rutas relativas internas con query', () => {
    expect(safeRedirectPath('/goals/aceptar?token=abc')).toBe('/goals/aceptar?token=abc');
    expect(safeRedirectPath('/goals')).toBe('/goals');
  });

  it.each([
    'https://evil.example/goals/aceptar',
    '//evil.example/goals/aceptar',
    '/\\evil.example',
    'javascript:alert(1)',
    'goals/aceptar',
    '',
  ])('rechaza destinos no seguros (%s)', (value) => {
    expect(safeRedirectPath(value)).toBeNull();
  });

  it('rechaza ausencia de destino', () => {
    expect(safeRedirectPath(null)).toBeNull();
    expect(safeRedirectPath(undefined)).toBeNull();
  });
});
