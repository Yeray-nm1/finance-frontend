import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '@/lib/api';
import ResetPasswordPage from '../page';

const navigation = vi.hoisted(() => ({ push: vi.fn(), token: 'token-valido' as string | null }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => new URLSearchParams(navigation.token ? `?token=${navigation.token}` : ''),
}));

vi.mock('@/lib/api', () => ({
  api: {
    auth: {
      resetPassword: vi.fn(),
    },
  },
}));

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.token = 'token-valido';
    vi.mocked(api.auth.resetPassword).mockResolvedValue(undefined);
  });

  it('cambia la contraseña con el token de la URL y vuelve al login', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText('Nueva contraseña'), 'NewPassword123');
    await user.type(screen.getByLabelText('Repetir contraseña'), 'NewPassword123');
    await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }));

    expect(api.auth.resetPassword).toHaveBeenCalledWith('token-valido', 'NewPassword123');
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/login?reset=1'));
  });

  it('no envía nada si las contraseñas no coinciden', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText('Nueva contraseña'), 'NewPassword123');
    await user.type(screen.getByLabelText('Repetir contraseña'), 'OtraPassword123');
    await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }));

    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(api.auth.resetPassword).not.toHaveBeenCalled();
  });

  it('rechaza enlaces sin token', () => {
    navigation.token = null;
    render(<ResetPasswordPage />);

    expect(screen.getByText(/El enlace no es válido/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Nueva contraseña')).not.toBeInTheDocument();
  });

  it('muestra el error del servidor', async () => {
    vi.mocked(api.auth.resetPassword).mockRejectedValue(new Error('Enlace caducado'));
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText('Nueva contraseña'), 'NewPassword123');
    await user.type(screen.getByLabelText('Repetir contraseña'), 'NewPassword123');
    await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }));

    await waitFor(() => expect(screen.getByText('Enlace caducado')).toBeInTheDocument());
    expect(navigation.push).not.toHaveBeenCalled();
  });
});
