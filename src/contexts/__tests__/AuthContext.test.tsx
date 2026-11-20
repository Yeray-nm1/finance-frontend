import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMock = vi.hoisted(() => ({
  auth: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    updateName: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('@/lib/api', () => ({ api: apiMock }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { AuthProvider } from '../AuthContext';
import { useAuth } from '@/hooks/useAuth';

function Consumer() {
  const { user, register, updateName } = useAuth();
  return (
    <div>
      <span data-testid="name">{user?.name ?? 'null'}</span>
      <button onClick={() => void register('ana@example.com', 'Password1', ' Ana ')}>
        registrar
      </button>
      <button onClick={() => void updateName('Beto')}>actualizar</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  apiMock.auth.me.mockResolvedValue({
    user: { id: 'u1', email: 'ana@example.com', name: null, createdAt: '2026-11-20' },
  });
});

describe('AuthContext · nombre del usuario', () => {
  it('CA-1 me expone el nombre devuelto por el backend', async () => {
    apiMock.auth.me.mockResolvedValueOnce({
      user: { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-11-20' },
    });

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('name')).toHaveTextContent('Ana'));
  });

  it('CA-2 register envía el nombre y actualiza el usuario', async () => {
    const user = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-11-20' };
    apiMock.auth.register.mockResolvedValue({ user });
    const interactions = userEvent.setup();
    renderProvider();
    await waitFor(() => expect(apiMock.auth.me).toHaveBeenCalled());

    await interactions.click(screen.getByRole('button', { name: 'registrar' }));

    expect(apiMock.auth.register).toHaveBeenCalledWith('ana@example.com', 'Password1', ' Ana ');
    await waitFor(() => expect(screen.getByTestId('name')).toHaveTextContent('Ana'));
  });

  it('CA-3 updateName actualiza el usuario sin recargar', async () => {
    apiMock.auth.updateName.mockResolvedValue({
      id: 'u1',
      email: 'ana@example.com',
      name: 'Beto',
      createdAt: '2026-11-20',
    });
    const interactions = userEvent.setup();
    renderProvider();
    await waitFor(() => expect(apiMock.auth.me).toHaveBeenCalled());

    await interactions.click(screen.getByRole('button', { name: 'actualizar' }));

    await act(async () => {
      await Promise.resolve();
    });
    expect(apiMock.auth.updateName).toHaveBeenCalledWith('Beto');
    await waitFor(() => expect(screen.getByTestId('name')).toHaveTextContent('Beto'));
  });
});
