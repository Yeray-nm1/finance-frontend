import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { GoalCard } from '../GoalCard';
import type { SavingsGoal } from '@/types/goals';

const goal: SavingsGoal = {
  id: 'goal-1',
  name: 'Viaje a Japón',
  targetAmount: 1000,
  targetDate: '2027-06-01T00:00:00.000Z',
  accountId: 'account-1',
  account: { id: 'account-1', name: 'Ahorro viaje', type: 'savings' },
  isArchived: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  saved: 250,
  progress: 25,
  remaining: 750,
  monthlyNeeded: 100,
  contributionsCount: 2,
};

const handlers = {
  onContribute: vi.fn(),
  onEdit: vi.fn(),
  onToggleArchive: vi.fn(),
  onDelete: vi.fn(),
  onViewContributions: vi.fn(),
};

describe('GoalCard', () => {
  it('shows the goal progress and remaining amount', () => {
    render(<GoalCard goal={goal} {...handlers} />);

    expect(screen.getByRole('heading', { name: 'Viaje a Japón' })).toBeInTheDocument();
    expect(screen.getByText('Ahorro viaje')).toBeInTheDocument();
    expect(screen.getByText(/250,00/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');
    expect(screen.getByText(/Faltan/)).toBeInTheDocument();
    expect(screen.getByText(/100,00.*mes/)).toBeInTheDocument();
    expect(screen.getByText(/jun 2027/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aportaciones (2)' })).toBeInTheDocument();
  });

  it('calls the card actions', async () => {
    const user = userEvent.setup();
    render(<GoalCard goal={goal} {...handlers} />);

    await user.click(screen.getByRole('button', { name: /^Aportar/ }));
    expect(handlers.onContribute).toHaveBeenCalledWith(goal);

    await user.click(screen.getByRole('button', { name: 'Editar Viaje a Japón' }));
    expect(handlers.onEdit).toHaveBeenCalledWith(goal);

    await user.click(screen.getByRole('button', { name: 'Archivar Viaje a Japón' }));
    expect(handlers.onToggleArchive).toHaveBeenCalledWith(goal);

    await user.click(screen.getByRole('button', { name: 'Eliminar Viaje a Japón' }));
    expect(handlers.onDelete).toHaveBeenCalledWith(goal);
  });

  it('disables contributions when the goal has no savings account', () => {
    render(
      <GoalCard
        goal={{ ...goal, accountId: null, account: null }}
        {...handlers}
      />
    );

    expect(screen.getByText('Sin cuenta de ahorro')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Aportar/ })).toBeDisabled();
  });

  it('marks archived goals and disables contributions', () => {
    render(<GoalCard goal={{ ...goal, isArchived: true }} {...handlers} />);

    expect(screen.getByText('Archivada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Aportar/ })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Reactivar Viaje a Japón' })
    ).toBeInTheDocument();
  });

  it('exposes a data attribute for the archive animation', () => {
    const { container } = render(<GoalCard goal={goal} {...handlers} />);

    expect(container.querySelector('[data-goal-card="goal-1"]')).toBeInTheDocument();
  });
});
