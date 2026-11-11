import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChangePasswordDialog } from '../ChangePasswordDialog';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    auth: {
      changePassword: vi.fn(),
    },
  },
}));

function renderDialog(overrides: Partial<React.ComponentProps<typeof ChangePasswordDialog>> = {}) {
  return render(
    <ChangePasswordDialog
      open={true}
      onOpenChange={vi.fn()}
      onChanged={vi.fn()}
      {...overrides}
    />
  );
}

async function fillForm(current: string, next: string, confirm: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/contraseña actual/i), current);
  await user.type(screen.getByLabelText(/^nueva contraseña$/i), next);
  await user.type(screen.getByLabelText(/repite la nueva contraseña/i), confirm);
  return user;
}

describe('ChangePasswordDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.auth.changePassword).mockResolvedValue(undefined);
  });

  it('rejects mismatched passwords without calling the API', async () => {
    renderDialog();
    const user = await fillForm('OldPass1', 'NewPass1', 'NewPass2');

    await user.click(screen.getByRole('button', { name: /guardar/i }));

    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(api.auth.changePassword).not.toHaveBeenCalled();
  });

  it('rejects a weak new password without calling the API', async () => {
    renderDialog();
    const user = await fillForm('OldPass1', 'weakpass', 'weakpass');

    await user.click(screen.getByRole('button', { name: /guardar/i }));

    expect(
      screen.getByText('Mínimo 8 caracteres, con mayúscula, minúscula y número.', {
        selector: 'div',
      })
    ).toBeInTheDocument();
    expect(api.auth.changePassword).not.toHaveBeenCalled();
  });

  it('changes the password and closes the dialog on success', async () => {
    const onOpenChange = vi.fn();
    const onChanged = vi.fn();
    renderDialog({ onOpenChange, onChanged });

    const user = await fillForm('OldPass1', 'NewPass1', 'NewPass1');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    expect(api.auth.changePassword).toHaveBeenCalledWith('OldPass1', 'NewPass1');
    expect(onChanged).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows the API error when the current password is wrong', async () => {
    vi.mocked(api.auth.changePassword).mockRejectedValue(
      new Error('La contraseña actual no es correcta')
    );
    renderDialog();

    const user = await fillForm('WrongPass1', 'NewPass1', 'NewPass1');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    expect(
      await screen.findByText('La contraseña actual no es correcta')
    ).toBeInTheDocument();
  });
});
