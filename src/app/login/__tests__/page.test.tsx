import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../page';

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  params: new URLSearchParams(),
}));

const auth = vi.hoisted(() => ({ login: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => navigation.params,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ login: auth.login }),
}));

async function signIn() {
  const user = userEvent.setup();
  render(<LoginPage />);
  await user.type(screen.getByLabelText('Email'), 'demo@example.com');
  await user.type(screen.getByLabelText('Contrasena'), 'Password123');
  await user.click(screen.getByRole('button', { name: 'Iniciar Sesion' }));
}

describe('LoginPage · retorno seguro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.params = new URLSearchParams();
    auth.login.mockResolvedValue(undefined);
  });

  it('vuelve al enlace de aceptación tras iniciar sesión', async () => {
    navigation.params = new URLSearchParams(
      '?next=%2Fgoals%2Faceptar%3Ftoken%3Dtoken-valido'
    );
    await signIn();

    await waitFor(() =>
      expect(navigation.push).toHaveBeenCalledWith('/goals/aceptar?token=token-valido')
    );
  });

  it.each([
    'https://evil.example/goals/aceptar',
    '//evil.example/goals/aceptar',
    'javascript:alert(1)',
  ])('ignora un retorno externo (%s)', async (next) => {
    navigation.params = new URLSearchParams(`?next=${encodeURIComponent(next)}`);
    await signIn();

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/dashboard'));
  });

  it('va al dashboard cuando no hay retorno', async () => {
    await signIn();

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/dashboard'));
  });
});
