import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { GoalDialog } from '../GoalDialog';
import type { Account } from '@/types/accounts';

const savingsAccount: Account = {
  id: 'account-1',
  userId: 'user-1',
  name: 'Ahorro viaje',
  type: 'savings',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('GoalDialog', () => {
  it('submits the goal with the selected savings account', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <GoalDialog
        open
        goal={null}
        accounts={[savingsAccount]}
        saving={false}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
        onAccountCreated={vi.fn()}
      />
    );

    await user.type(screen.getByLabelText('Nombre'), 'Viaje a Japón');
    await user.type(screen.getByLabelText('Objetivo (€)'), '1200');
    await user.click(screen.getByRole('button', { name: 'Crear meta' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Viaje a Japón',
      targetAmount: 1200,
      targetDate: null,
      accountId: 'account-1',
    });
  });

  it('marks the target date as optional with a hint', () => {
    render(
      <GoalDialog
        open
        goal={null}
        accounts={[savingsAccount]}
        saving={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        onAccountCreated={vi.fn()}
      />
    );

    const hint = screen.getByRole('tooltip');
    expect(hint).toHaveTextContent(
      'Opcional: si la dejas vacía, la meta no tendrá fecha límite.'
    );
    expect(
      screen.getByLabelText('Más información sobre la fecha objetivo')
    ).toHaveAttribute('aria-describedby', hint.id);
    expect(screen.getByLabelText('Fecha objetivo')).not.toBeRequired();
  });

  it('keeps the submit disabled without a savings account', () => {
    render(
      <GoalDialog
        open
        goal={null}
        accounts={[]}
        saving={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        onAccountCreated={vi.fn()}
      />
    );

    expect(
      screen.getByText('Necesitas una cuenta de ahorro para asociar la meta.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear meta' })).toBeDisabled();
  });

  it('fills the form when editing a goal', () => {
    render(
      <GoalDialog
        open
        goal={{
          id: 'goal-1',
          name: 'Coche',
          targetAmount: 5000,
          targetDate: '2027-01-01T00:00:00.000Z',
          accountId: 'account-1',
          account: savingsAccount,
          isArchived: false,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          saved: 1000,
          progress: 20,
          remaining: 4000,
          monthlyNeeded: 400,
          contributionsCount: 3,
        }}
        accounts={[savingsAccount]}
        saving={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        onAccountCreated={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Nombre')).toHaveValue('Coche');
    expect(screen.getByLabelText('Objetivo (€)')).toHaveValue(5000);
    expect(screen.getByLabelText('Fecha objetivo')).toHaveValue('2027-01-01');
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeEnabled();
  });
});
