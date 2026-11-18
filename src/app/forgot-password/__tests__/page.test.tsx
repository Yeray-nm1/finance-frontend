import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '@/lib/api';
import ForgotPasswordPage from '../page';

vi.mock('@/lib/api', () => ({
  api: {
    auth: {
      forgotPassword: vi.fn(),
    },
  },
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.auth.forgotPassword).mockResolvedValue(undefined);
  });

  it('pide el email y muestra siempre el mismo mensaje', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText('Email'), 'user@example.com');
    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }));

    expect(api.auth.forgotPassword).toHaveBeenCalledWith('user@example.com');
    expect(
      await screen.findByText(/Si el email está registrado, te hemos enviado un enlace/i)
    ).toBeInTheDocument();
  });

  it('muestra el error cuando la petición falla', async () => {
    vi.mocked(api.auth.forgotPassword).mockRejectedValue(new Error('Servidor no disponible'));
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText('Email'), 'user@example.com');
    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }));

    await waitFor(() => expect(screen.getByText('Servidor no disponible')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Volver a iniciar sesión' })).toBeInTheDocument();
  });

  it('mantiene el enlace de volver antes de enviar nada', () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByRole('link', { name: 'Volver a iniciar sesión' })).toHaveAttribute(
      'href',
      '/login'
    );
  });
});
