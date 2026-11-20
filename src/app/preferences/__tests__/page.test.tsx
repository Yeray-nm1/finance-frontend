import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({
  user: { id: 'u1', email: 'ana@example.com', name: 'Ana' as string | null, createdAt: '2026-11-20' },
  logout: vi.fn(),
  updateName: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: auth.user, logout: auth.logout, updateName: auth.updateName }),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));
vi.mock('../components/NotificationSettings', () => ({
  NotificationSettings: () => <p>Panel de notificaciones</p>,
}));
vi.mock('../components/ChangePasswordDialog', () => ({ ChangePasswordDialog: () => null }));
vi.mock('../components/DeleteAccountDialog', () => ({ DeleteAccountDialog: () => null }));
vi.mock('../components/DeleteDataDialog', () => ({ DeleteDataDialog: () => null }));

import PreferencesPage from '../page';

beforeEach(() => {
  vi.clearAllMocks();
  window.history.pushState({}, '', '/preferences');
  auth.user.name = 'Ana';
  auth.updateName.mockResolvedValue(undefined);
});

describe('PreferencesPage · tabs', () => {
  it('CA-20 muestra cuatro pestañas y solo el panel activo', async () => {
    const user = userEvent.setup();
    render(<PreferencesPage />);

    const tabs = screen.getAllByRole('tab');
    expect(screen.getByRole('tablist').className).not.toContain('overflow');
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'Perfil',
      'Cuentas bancarias',
      'Notificaciones',
      'Sesión',
    ]);
    expect(screen.getByRole('tab', { name: 'Perfil' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByText('Panel de notificaciones')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Borrar mi cuenta' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Notificaciones' }));

    expect(screen.getByRole('tab', { name: 'Notificaciones' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Panel de notificaciones')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Cambiar nombre' })).not.toBeInTheDocument();
  });

  it('CA-20 abre notificaciones cuando el correo llega con focus', () => {
    window.history.pushState({}, '', '/preferences?focus=goalReminder');
    render(<PreferencesPage />);

    expect(screen.getByRole('tab', { name: 'Notificaciones' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Panel de notificaciones')).toBeVisible();
  });

  it('CA-20 abre notificaciones cuando el correo llega con unsubscribed', () => {
    window.history.pushState({}, '', '/preferences?unsubscribed=1');
    render(<PreferencesPage />);

    expect(screen.getByRole('tab', { name: 'Notificaciones' })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('PreferencesPage · nombre del usuario', () => {
  async function startEditing(
    user: ReturnType<typeof userEvent.setup>,
    currentName = 'Ana'
  ) {
    render(<PreferencesPage />);
    expect(screen.getByText(currentName, { exact: true })).toBeVisible();
    expect(screen.queryByLabelText('Nombre')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cambiar nombre' }));
    return screen.getByLabelText('Nombre');
  }

  it('CA-21 muestra el nombre como texto y lo edita solo al pulsar Cambiar nombre', async () => {
    const user = userEvent.setup();
    const field = await startEditing(user);

    expect(field).toHaveValue('Ana');
    expect(screen.getByRole('button', { name: 'Cancelar' }).className).toContain('bg-[#dc2626]');
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
  });

  it('CA-21 el nombre va arriba, el email debajo y la contraseña la última', () => {
    render(<PreferencesPage />);

    const name = screen.getByText('Nombre', { exact: true });
    const email = screen.getByText('Email', { exact: true });
    const password = screen.getByText('Contraseña', { exact: true });

    expect(name.compareDocumentPosition(email) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(email.compareDocumentPosition(password) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('CA-21 Cambiar nombre está a la derecha y no hay texto explicativo', () => {
    render(<PreferencesPage />);

    const changeButton = screen.getByRole('button', { name: 'Cambiar nombre' });
    expect(changeButton.parentElement?.className).toContain('justify-between');
    expect(screen.queryByText(/Lo usaremos para saludarte/)).not.toBeInTheDocument();
  });

  it('CA-21 cancelar descarta los cambios sin llamar a la API', async () => {
    const user = userEvent.setup();
    const field = await startEditing(user);

    await user.clear(field);
    await user.type(field, 'Otro nombre');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(auth.updateName).not.toHaveBeenCalled();
    expect(screen.getByText('Ana', { exact: true })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Cambiar nombre' })).toBeVisible();
  });

  it('CA-21 el mismo nombre, los espacios y los espacios dobles no permiten guardar', async () => {
    const auth2 = auth;
    auth2.user.name = 'Ana Pérez';
    const user = userEvent.setup();
    const field = await startEditing(user, 'Ana Pérez');

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
    await user.clear(field);
    await user.type(field, '   ');
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
    await user.clear(field);
    await user.paste('  Ana   Pérez  ');
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
    expect(auth.updateName).not.toHaveBeenCalled();
  });

  it('CA-21 guarda el nombre recortado y colapsa los espacios internos', async () => {
    auth.user.name = 'Ana Pérez';
    const user = userEvent.setup();
    const field = await startEditing(user, 'Ana Pérez');

    await user.clear(field);
    await user.paste('  Ana   Pérez   García  ');
    const save = screen.getByRole('button', { name: 'Guardar' });
    expect(save).toBeEnabled();
    await user.click(save);

    await waitFor(() =>
      expect(auth.updateName).toHaveBeenCalledWith('Ana Pérez García')
    );
    expect(screen.getByText('Ana Pérez García', { exact: true })).toBeVisible();
    expect(screen.queryByLabelText('Nombre')).not.toBeInTheDocument();
  });

  it('CA-21 dejar el campo realmente vacío permite borrar el nombre', async () => {
    const user = userEvent.setup();
    const field = await startEditing(user);

    await user.clear(field);
    const save = screen.getByRole('button', { name: 'Guardar' });
    expect(save).toBeEnabled();
    await user.click(save);

    await waitFor(() => expect(auth.updateName).toHaveBeenCalledWith(''));
    expect(screen.getByText('Añade tu nombre', { exact: true })).toBeVisible();
  });

  it('CA-21 sin nombre todavía no se puede guardar un nombre vacío', async () => {
    auth.user.name = null;
    const user = userEvent.setup();
    render(<PreferencesPage />);

    expect(screen.getByText('Añade tu nombre', { exact: true })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Cambiar nombre' }));

    expect(screen.getByLabelText('Nombre')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
  });
});
