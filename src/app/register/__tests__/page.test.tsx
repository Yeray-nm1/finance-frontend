import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
const auth = vi.hoisted(() => ({ register: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: navigation.push }) }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ register: auth.register }) }));

import RegisterPage from '../page';

async function fillForm(user: ReturnType<typeof userEvent.setup>, name?: string) {
  render(<RegisterPage />);
  if (name !== undefined) await user.type(screen.getByLabelText('Nombre'), name);
  await user.type(screen.getByLabelText('Email'), 'ana@example.com');
  await user.type(screen.getByLabelText('Contraseña'), 'Password123');
  await user.click(screen.getByRole('button', { name: 'Registrarse' }));
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.register.mockResolvedValue(undefined);
});

describe('RegisterPage · nombre opcional', () => {
  it('CA-2 envía el nombre escrito al registrar', async () => {
    const user = userEvent.setup();
    await fillForm(user, 'Ana');

    await waitFor(() =>
      expect(auth.register).toHaveBeenCalledWith('ana@example.com', 'Password123', 'Ana')
    );
  });

  it('CA-1 funciona sin nombre y navega al dashboard', async () => {
    const user = userEvent.setup();
    await fillForm(user);

    await waitFor(() =>
      expect(auth.register).toHaveBeenCalledWith('ana@example.com', 'Password123', '')
    );
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/dashboard'));
  });
});
