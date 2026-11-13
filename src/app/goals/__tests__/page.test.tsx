import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '@/lib/api';
import type { Account } from '@/types/accounts';
import type { SavingsGoal } from '@/types/goals';
import GoalsPage from '../page';

vi.mock('@/lib/api', () => ({
  api: {
    goals: {
      list: vi.fn(),
      update: vi.fn(),
    },
    accounts: {
      list: vi.fn(),
    },
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

const savingsAccount: Account = {
  id: 'account-1',
  userId: 'user-1',
  name: 'Ahorro viaje',
  type: 'savings',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const goal: SavingsGoal = {
  id: 'goal-1',
  name: 'Viaje a Japón',
  targetAmount: 1000,
  targetDate: null,
  accountId: 'account-1',
  account: { id: 'account-1', name: 'Ahorro viaje', type: 'savings' },
  isArchived: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  saved: 250,
  progress: 25,
  remaining: 750,
  monthlyNeeded: null,
  contributionsCount: 1,
};

describe('GoalsPage tabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.accounts.list).mockResolvedValue([savingsAccount]);
    vi.mocked(api.goals.list).mockResolvedValue([goal]);
    vi.mocked(api.goals.update).mockResolvedValue({ ...goal, isArchived: true });
  });

  it('keeps the Activas tab when archiving the only active goal', async () => {
    const user = userEvent.setup();
    render(<GoalsPage />);

    await screen.findByText('Viaje a Japón');
    const activeTab = screen.getByRole('tab', { name: /Activas/ });
    expect(activeTab).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('button', { name: 'Archivar Viaje a Japón' }));

    await waitFor(() => {
      expect(api.goals.update).toHaveBeenCalledWith('goal-1', { isArchived: true });
    });
    expect(activeTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Aún no tienes metas de ahorro')).toBeInTheDocument();
    expect(screen.queryByText('Viaje a Japón')).not.toBeInTheDocument();
  });

  it('keeps the Archivadas tab when reactivating the only archived goal', async () => {
    vi.mocked(api.goals.list).mockResolvedValue([{ ...goal, isArchived: true }]);
    vi.mocked(api.goals.update).mockResolvedValue(goal);
    const user = userEvent.setup();
    render(<GoalsPage />);

    await user.click(await screen.findByRole('tab', { name: /Archivadas/ }));
    await screen.findByText('Viaje a Japón');
    const archivedTab = screen.getByRole('tab', { name: /Archivadas/ });
    expect(archivedTab).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('button', { name: 'Reactivar Viaje a Japón' }));

    await waitFor(() => {
      expect(api.goals.update).toHaveBeenCalledWith('goal-1', { isArchived: false });
    });
    expect(archivedTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('No hay metas archivadas')).toBeInTheDocument();
    expect(screen.queryByText('Viaje a Japón')).not.toBeInTheDocument();
  });
});
