import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GoalDialog } from '../GoalDialog';
import { DEFAULT_NOTIFICATION_RULES } from '@/lib/notification-rules';
import type { NotificationRules } from '@/types/notifications';
import type { Account } from '@/types/accounts';
import type { SavingsGoal } from '@/types/goals';

const savingsAccount: Account = {
  id: 'account-1',
  userId: 'user-1',
  name: 'Ahorro viaje',
  type: 'savings',
  createdAt: '2026-01-01T00:00:00.000Z',
};

/** Correo global apagado: el canal por defecto de la meta es solo la app. */
const rulesOn: NotificationRules = {
  subscriptionDue: { enabled: true, emailEnabled: true, daysBefore: 7 },
  spendingSummary: { enabled: false, emailEnabled: true, frequency: 'monthly' },
  goalReminder: { enabled: true, emailEnabled: false },
};

const rulesOff: NotificationRules = {
  ...rulesOn,
  goalReminder: { enabled: false, emailEnabled: false },
};

function renderDialog(overrides: Partial<React.ComponentProps<typeof GoalDialog>> = {}) {
  const props = {
    open: true,
    goal: null,
    accounts: [savingsAccount],
    saving: false,
    notificationRules: rulesOn,
    onSaveNotificationRules: vi.fn().mockResolvedValue(undefined),
    onOpenChange: vi.fn(),
    onSubmit: vi.fn(),
    onAccountCreated: vi.fn(),
    ...overrides,
  };
  render(<GoalDialog {...props} />);
  return props;
}

async function fillBasics(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nombre'), 'Viaje a Japón');
  await user.type(screen.getByLabelText('Objetivo (€)'), '1200');
}

async function enableReminder(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('switch', { name: 'Recordatorio de aportación' }));
}

function storedGoal(overrides: Partial<SavingsGoal> = {}): SavingsGoal {
  return {
    id: 'goal-1',
    name: 'Coche',
    targetAmount: 5000,
    targetDate: null,
    accountId: 'account-1',
    account: savingsAccount,
    isArchived: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    reminderFrequency: 'MONTHLY',
    reminderChannel: 'APP_AND_EMAIL',
    reminderWeekday: null,
    reminderDay: 5,
    reminderLastDay: false,
    reminderInterval: null,
    reminderIntervalUnit: null,
    reminderStartDate: null,
    reminderAmount: 250,
    reminderEnabled: true,
    saved: 1000,
    progress: 20,
    remaining: 4000,
    monthlyNeeded: 400,
    contributionsCount: 3,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GoalDialog · avisos de meta', () => {
  it('una meta nueva nace sin avisos y envía reminderEnabled false', async () => {
    const user = userEvent.setup();
    const props = renderDialog();

    expect(screen.getByRole('switch', { name: 'Recordatorio de aportación' })).not.toBeChecked();
    expect(screen.queryByRole('combobox', { name: 'Canal' })).not.toBeInTheDocument();

    await fillBasics(user);
    await user.click(screen.getByRole('button', { name: 'Crear meta' }));

    expect(props.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Viaje a Japón',
        targetAmount: 1200,
        targetDate: null,
        accountId: 'account-1',
        reminderEnabled: false,
        reminderDay: null,
        reminderAmount: null,
      })
    );
  });

  it('CA-9 el recordatorio nace plegado y se despliega al activar el interruptor', async () => {
    const user = userEvent.setup();
    renderDialog();

    expect(screen.getByRole('switch', { name: 'Recordatorio de aportación' })).not.toBeChecked();
    expect(screen.queryByRole('combobox', { name: 'Canal' })).not.toBeInTheDocument();
    await enableReminder(user);

    expect(screen.getByRole('switch', { name: 'Recordatorio de aportación' })).toBeChecked();
    expect(screen.getByRole('combobox', { name: 'Canal' })).toBeInTheDocument();
    expect(screen.getByText('Te avisaremos el día 1 de cada mes, solo en la app.')).toBeVisible();
  });

  it('CA-12 el canal por defecto sigue al interruptor global de correo', async () => {
    const user = userEvent.setup();
    renderDialog();

    await enableReminder(user);
    await user.type(screen.getByLabelText('Día del mes'), '18');

    expect(
      screen.getByText('Te avisaremos el día 18 de cada mes, solo en la app.')
    ).toBeVisible();
  });

  it('editar una meta carga su toggle, día e importe al abrir', async () => {
    renderDialog({ goal: storedGoal() });

    expect(screen.getByRole('switch', { name: 'Recordatorio de aportación' })).toBeChecked();
    expect(screen.getByText('Te avisaremos el día 5 de cada mes, en la app y por email.')).toBeVisible();
    expect(screen.getByLabelText('Día del mes')).toHaveValue(5);
    expect(screen.getByLabelText('Importe sugerido (€)')).toHaveValue(250);
  });

  it('si falla el guardado global al crear, no se envía la meta y se avisa', async () => {
    const user = userEvent.setup();
    const onSaveNotificationRules = vi.fn().mockRejectedValue(new Error('boom'));
    const props = renderDialog({ notificationRules: rulesOff, onSaveNotificationRules });

    await enableReminder(user);
    await user.type(screen.getByLabelText('Día del mes'), '18');
    await fillBasics(user);
    await user.click(screen.getByRole('button', { name: 'Crear meta' }));

    expect(
      await screen.findByRole('alert', { name: 'Error al activar los avisos' })
    ).toHaveTextContent('No se pudo activar el aviso global. Revisa tus preferencias.');
    await waitFor(() => expect(props.onSubmit).not.toHaveBeenCalled());
    expect(screen.getByRole('switch', { name: 'Recordatorio de aportación' })).not.toBeChecked();
  });

  it('la fecha objetivo sigue siendo opcional y sin hint', () => {
    renderDialog();

    expect(screen.getByLabelText('Fecha objetivo')).not.toBeRequired();
    expect(screen.queryByLabelText('Más información sobre la fecha objetivo')).not.toBeInTheDocument();
    expect(screen.queryByText(/Opcional: si la dejas vacía/)).not.toBeInTheDocument();
  });

  it('mantiene deshabilitado el submit sin cuenta de ahorro', () => {
    renderDialog({ accounts: [] });

    expect(
      screen.getByText('Necesitas una cuenta de ahorro para asociar la meta.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear meta' })).toBeDisabled();
  });

  it('usa los valores por defecto compartidos con Preferencias', () => {
    expect(DEFAULT_NOTIFICATION_RULES.goalReminder).toEqual({
      enabled: false,
      emailEnabled: false,
    });
  });
});
