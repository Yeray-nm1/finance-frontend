import { describe, expect, it, vi } from 'vitest';

vi.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: URL | string) => ({ kind: 'redirect', url: String(url) }),
    next: () => ({ kind: 'next' }),
  },
}));

import { middleware } from './middleware';

function request(pathname: string, search = '', loggedIn = false) {
  const base = 'http://localhost:3001';
  const href = `${base}${pathname}${search}`;
  return {
    url: href,
    cookies: {
      get: (name: string) =>
        loggedIn && name === 'finance_token' ? { value: 'session-token' } : undefined,
    },
    nextUrl: { pathname, search, href },
  } as never;
}

describe('middleware · retorno al enlace de aportación', () => {
  it('redirige al login conservando la ruta y el token', () => {
    const result = middleware(request('/goals/aceptar', '?token=abc')) as {
      kind: string;
      url: string;
    };

    expect(result.kind).toBe('redirect');
    expect(result.url).toBe(
      'http://localhost:3001/login?next=%2Fgoals%2Faceptar%3Ftoken%3Dabc'
    );
  });

  it('deja pasar al usuario autenticado', () => {
    expect(middleware(request('/goals/aceptar', '?token=abc', true))).toMatchObject({
      kind: 'next',
    });
  });

  it('respeta un retorno interno si el usuario ya está autenticado', () => {
    const result = middleware(
      request('/login', '?next=%2Fgoals%2Faceptar%3Ftoken%3Dabc', true)
    ) as { kind: string; url: string };

    expect(result.url).toBe('http://localhost:3001/goals/aceptar?token=abc');
  });

  it('ignora retornos externos y envía al dashboard', () => {
    const result = middleware(
      request('/login', '?next=https%3A%2F%2Fevil.example', true)
    ) as { kind: string; url: string };

    expect(result.url).toBe('http://localhost:3001/dashboard');
  });

  it('sin retorno, un usuario autenticado en login va al dashboard', () => {
    const result = middleware(request('/login', '', true)) as { kind: string; url: string };

    expect(result.url).toBe('http://localhost:3001/dashboard');
  });

  it('no redirige las rutas API', () => {
    expect(middleware(request('/api/v1/goal-contributions/pending', '?token=abc'))).toMatchObject({
      kind: 'next',
    });
  });
});
