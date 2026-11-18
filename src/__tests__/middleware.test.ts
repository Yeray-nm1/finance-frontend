import { describe, expect, it } from 'vitest';
import type { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

function request(pathname: string, loggedIn: boolean): NextRequest {
  return {
    url: `http://localhost:3001${pathname}`,
    nextUrl: { pathname },
    cookies: { get: () => (loggedIn ? { value: 'token' } : undefined) },
  } as unknown as NextRequest;
}

describe('middleware de sesión', () => {
  it('deja pasar las rutas de recuperación sin sesión', () => {
    for (const path of ['/forgot-password', '/reset-password']) {
      const response = middleware(request(path, false));
      expect(response.status, path).toBe(200);
      expect(response.headers.get('location'), path).toBeNull();
    }
  });

  it('permite usar el enlace de restablecimiento aunque haya sesión iniciada', () => {
    const response = middleware(request('/reset-password?token=abc', true));
    expect(response.status).toBe(200);
  });

  it('sigue mandando al login las rutas privadas sin sesión', () => {
    const response = middleware(request('/dashboard', false));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });
});
