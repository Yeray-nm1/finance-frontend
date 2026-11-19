import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import type { Account } from '@/types/accounts';
import type { NotificationRules } from '@/types/notifications';
import type { SavingsGoal } from '@/types/goals';
import GoalsPage from '../page';

vi.mock('@/lib/api', () => ({
  api: {
    goals: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    accounts: {
      list: vi.fn(),
    },
    notifications: {
      rules: {
        get: vi.fn(),
        save: vi.fn(),
      },
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
  reminderDay: 18,
  reminderAmount: 100,
  reminderEnabled: true,
  saved: 250,
  progress: 25,
  remaining: 750,
  monthlyNeeded: null,
  contributionsCount: 1,
};

const rulesOff: NotificationRules = {
  subscriptionDue: { enabled: true, emailEnabled: true, daysBefore: 7 },
  spendingSummary: { enabled: false, emailEnabled: true, frequency: 'monthly' },
  goalReminder: { enabled: false, emailEnabled: false },
};

async function openCreateDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Nueva meta' }));
  await screen.findByLabelText('Nombre');
}

describe('GoalsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.accounts.list).mockResolvedValue([savingsAccount]);
    vi.mocked(api.goals.list).mockResolvedValue([goal]);
    vi.mocked(api.goals.create).mockResolvedValue(goal);
    vi.mocked(api.goals.update).mockResolvedValue({ ...goal, isArchived: true });
    vi.mocked(api.notifications.rules.get).mockResolvedValue(rulesOff);
    vi.mocked(api.notifications.rules.save).mockImplementation(async (rules) => rules);
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
  });

  it('keeps the Archivadas tab when reactivating the only archived goal', async () => {
    vi.mocked(api.goals.list).mockResolvedValue([{ ...goal, isArchived: true }]);
    vi.mocked(api.goals.update).mockResolvedValue(goal);
    const user = userEvent.setup();
    render(<GoalsPage />);

    await user.click(await screen.findByRole('tab', { name: /Archivadas/ }));
    await screen.findByText('Viaje a Japón');
    const archivedTab = screen.getByRole('tab', { name: /Archivadas/ });

    await user.click(screen.getByRole('button', { name: 'Reactivar Viaje a Japón' }));

    await waitFor(() => {
      expect(api.goals.update).toHaveBeenCalledWith('goal-1', { isArchived: false });
    });
    expect(archivedTab).toHaveAttribute('aria-selected', 'true');
  });

  it('CA-WI5.5 / 2 carga las reglas globales y muestra el badge ámbar como subtítulo', async () => {
    render(<GoalsPage />);

    expect(await screen.findByRole('button', { name: 'Avisos pausados' })).toBeVisible();
    expect(api.notifications.rules.get).toHaveBeenCalledOnce();
  });

  it('CA-WI5.3 guarda las reglas fusionadas y crea la meta con el aviso encendido', async () => {
    const user = userEvent.setup();
    render(<GoalsPage />);
    await openCreateDialog(user);

    await user.type(screen.getByLabelText('Nombre'), 'Fondo de emergencia');
    await user.type(screen.getByLabelText('Objetivo (€)'), '2000');
    await user.click(screen.getByRole('switch', { name: 'Aviso mensual de esta meta' }));
    await user.click(await screen.findByRole('button', { name: 'En la app y por email' }));
    await user.type(await screen.findByLabelText('Día del aviso'), '5');
    await user.click(screen.getByRole('button', { name: 'Crear meta' }));

    await waitFor(() =>
      expect(api.notifications.rules.save).toHaveBeenCalledWith({
        subscriptionDue: { enabled: true, emailEnabled: true, daysBefore: 7 },
        spendingSummary: { enabled: false, emailEnabled: true, frequency: 'monthly' },
        goalReminder: { enabled: true, emailEnabled: true },
      })
    );
    await waitFor(() =>
      expect(api.goals.create).toHaveBeenCalledWith(
        expect.objectContaining({ reminderEnabled: true, reminderDay: 5 })
      )
    );
  });

  it('CA-WI5.3 si falla el guardado global avisa con acceso a Preferencias', async () => {
    vi.mocked(api.notifications.rules.save).mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    render(<GoalsPage />);
    await openCreateDialog(user);

    await user.type(screen.getByLabelText('Nombre'), 'Fondo de emergencia');
    await user.type(screen.getByLabelText('Objetivo (€)'), '2000');
    await user.click(screen.getByRole('switch', { name: 'Aviso mensual de esta meta' }));
    await user.click(await screen.findByRole('button', { name: 'Solo en la app' }));
    await user.type(await screen.findByLabelText('Día del aviso'), '5');
    await user.click(screen.getByRole('button', { name: 'Crear meta' }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ actionLabel: 'Ir a Preferencias' })
      )
    );
    expect(api.goals.create).not.toHaveBeenCalled();
  });

  it('CA-WI5.5 al activar el global la tarjeta pasa a verde', async () => {
    const user = userEvent.setup();
    render(<GoalsPage />);
    await openCreateDialog(user);

    await user.type(screen.getByLabelText('Nombre'), 'Fondo de emergencia');
    await user.type(screen.getByLabelText('Objetivo (€)'), '2000');
    await user.click(screen.getByRole('switch', { name: 'Aviso mensual de esta meta' }));
    await user.click(await screen.findByRole('button', { name: 'Solo en la app' }));
    await user.type(await screen.findByLabelText('Día del aviso'), '5');
    await user.click(screen.getByRole('button', { name: 'Crear meta' }));

    await waitFor(() =>
      expect(api.notifications.rules.save).toHaveBeenCalledWith(
        expect.objectContaining({ goalReminder: { enabled: true, emailEnabled: false } })
      )
    );
    expect(
      await screen.findByRole('status', { name: 'Avisos de la meta activos' })
    ).toBeVisible();
  });
});
