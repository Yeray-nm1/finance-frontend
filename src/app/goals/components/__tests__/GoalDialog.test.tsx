import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
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

function toggle() {
  return screen.getByRole('switch', { name: 'Aviso mensual de esta meta' });
}

describe('GoalDialog · aviso mensual unificado', () => {
  it('CA-WI5.1 una meta nueva nace sin avisos y envía reminderEnabled false', async () => {
    const user = userEvent.setup();
    const props = renderDialog();

    expect(toggle()).not.toBeChecked();
    expect(screen.getByLabelText('Día del aviso')).toBeDisabled();
    expect(screen.getByLabelText('Importe sugerido (€)')).toBeDisabled();

    await fillBasics(user);
    await user.click(screen.getByRole('button', { name: 'Crear meta' }));

    expect(props.onSubmit).toHaveBeenCalledWith({
      name: 'Viaje a Japón',
      targetAmount: 1200,
      targetDate: null,
      accountId: 'account-1',
      reminderDay: null,
      reminderAmount: null,
      reminderEnabled: false,
    });
  });

  it('CA-WI5.2 con el global encendido el día es obligatorio y el importe opcional', async () => {
    const user = userEvent.setup();
    const props = renderDialog();

    await fillBasics(user);
    await user.click(toggle());
    await user.type(screen.getByLabelText('Día del aviso'), '18');

    const submit = screen.getByRole('button', { name: 'Crear meta' });
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(props.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        reminderEnabled: true,
        reminderDay: 18,
        reminderAmount: null,
      })
    );
  });

  it('CA-WI5.2 el día fuera de rango o el importe no positivo bloquean el guardado', async () => {
    const user = userEvent.setup();
    renderDialog();

    await fillBasics(user);
    await user.click(toggle());
    const day = screen.getByLabelText('Día del aviso');
    const amount = screen.getByLabelText('Importe sugerido (€)');
    const submit = screen.getByRole('button', { name: 'Crear meta' });

    expect(submit).toBeDisabled();
    await user.type(day, '29');
    expect(submit).toBeDisabled();
    await user.clear(day);
    await user.type(day, '18');
    expect(submit).toBeEnabled();
    await user.type(amount, '0');
    expect(submit).toBeDisabled();
    await user.clear(amount);
    await user.type(amount, '50');
    expect(submit).toBeEnabled();
  });

  it('5 en Nueva meta no hay icono info ni hint permanente junto al toggle', () => {
    renderDialog();

    expect(
      screen.queryByLabelText('Más información sobre los avisos de metas')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/No se realizará el movimiento hasta que confirmes/)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/El aviso global de Preferencias manda/)
    ).not.toBeInTheDocument();
    expect(screen.getByText('Cómo funciona')).toBeInTheDocument();
  });

  it('5 el selector de canales está siempre visible pero deshabilitado hasta encender el aviso', () => {
    const props = renderDialog({ notificationRules: rulesOff });

    expect(
      screen.queryByRole('dialog', { name: 'Activar avisos de metas' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Canales del aviso' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Solo en la app' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'En la app y por email' })).toBeDisabled();
    expect(screen.queryByText(/Aviso configurado/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Se activará al crear la meta/)).not.toBeInTheDocument();
    expect(props.onSaveNotificationRules).not.toHaveBeenCalled();
  });

  it('1A el toggle va a la derecha y no desplaza el resto del contenido', () => {
    renderDialog();

    const label = screen.getByText('Aviso mensual de esta meta');
    expect(label.compareDocumentPosition(toggle()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('1A solo se ofrecen los canales que soporta la app y el elegido queda marcado', async () => {
    const user = userEvent.setup();
    renderDialog({ notificationRules: rulesOff });

    await user.click(toggle());

    const app = screen.getByRole('button', { name: 'Solo en la app' });
    const both = screen.getByRole('button', { name: 'En la app y por email' });
    expect(screen.queryByRole('button', { name: 'Solo por email' })).not.toBeInTheDocument();
    expect(app).toBeEnabled();
    expect(both).toBeEnabled();
    expect(both).toHaveAttribute('aria-pressed', 'true');
    expect(both).toHaveClass('bg-[#005696]');

    await user.click(app);

    expect(app).toHaveAttribute('aria-pressed', 'true');
    expect(app).toHaveClass('bg-[#005696]');
    expect(both).toHaveAttribute('aria-pressed', 'false');
    expect(both).not.toHaveClass('bg-[#005696]');
  });

  it('5 no hay animación ni saltos: los campos están fijos desde el inicio', () => {
    renderDialog({ notificationRules: rulesOff });

    expect(document.querySelector('.animate-reveal-reminder')).toBeNull();
    expect(screen.getByRole('group', { name: 'Canales del aviso' })).toBeInTheDocument();
    expect(screen.getByLabelText('Día del aviso')).toBeInTheDocument();
    expect(screen.getByLabelText('Importe sugerido (€)')).toBeInTheDocument();
  });

  it('5 apagar el toggle deshabilita los campos sin ocultarlos ni dejar feedback', async () => {
    const user = userEvent.setup();
    renderDialog({ notificationRules: rulesOff });

    await user.click(toggle());
    expect(screen.getByRole('button', { name: 'Solo en la app' })).toBeEnabled();

    await user.click(toggle());
    expect(screen.getByRole('group', { name: 'Canales del aviso' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Solo en la app' })).toBeDisabled();
    expect(screen.getByLabelText('Día del aviso')).toBeDisabled();
    expect(screen.getByLabelText('Importe sugerido (€)')).toBeDisabled();
    expect(screen.queryByText(/Aviso configurado/)).not.toBeInTheDocument();
  });

  it('CA-WI5.3 elegir solo app inline guarda el global al crear la meta', async () => {
    const user = userEvent.setup();
    const props = renderDialog({ notificationRules: rulesOff });

    await user.click(toggle());
    await user.click(screen.getByRole('button', { name: 'Solo en la app' }));

    expect(toggle()).toBeChecked();
    expect(props.onSaveNotificationRules).not.toHaveBeenCalled();
    expect(screen.queryByText(/Aviso configurado/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Se activará al crear la meta/)).not.toBeInTheDocument();

    await fillBasics(user);
    await user.type(screen.getByLabelText('Día del aviso'), '18');
    await user.click(screen.getByRole('button', { name: 'Crear meta' }));

    await waitFor(() => expect(props.onSaveNotificationRules).toHaveBeenCalledWith({
      subscriptionDue: { enabled: true, emailEnabled: true, daysBefore: 7 },
      spendingSummary: { enabled: false, emailEnabled: true, frequency: 'monthly' },
      goalReminder: { enabled: true, emailEnabled: false },
    }));
    await waitFor(() => expect(props.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ reminderEnabled: true })
    ));
  });

  it('CA-WI5.3 elegir app y email activa el correo al crear la meta', async () => {
    const option = 'En la app y por email';
    const user = userEvent.setup();
    const props = renderDialog({ notificationRules: rulesOff });

    await user.click(toggle());
    await user.click(screen.getByRole('button', { name: option }));
    expect(screen.queryByText(/Aviso configurado/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Se activará al crear la meta/)).not.toBeInTheDocument();
    await fillBasics(user);
    await user.type(screen.getByLabelText('Día del aviso'), '18');
    await user.click(screen.getByRole('button', { name: 'Crear meta' }));

    await waitFor(() =>
      expect(props.onSaveNotificationRules).toHaveBeenCalledWith(
        expect.objectContaining({
          goalReminder: { enabled: true, emailEnabled: true },
        })
      )
    );
  });

  it('5 con el global encendido, el canal elegido actualiza el correo global al guardar', async () => {
    const user = userEvent.setup();
    const props = renderDialog({
      notificationRules: {
        ...rulesOn,
        goalReminder: { enabled: true, emailEnabled: false },
      },
    });

    expect(screen.getByRole('button', { name: 'Solo en la app' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    await user.click(toggle());
    await user.click(screen.getByRole('button', { name: 'En la app y por email' }));
    await fillBasics(user);
    await user.type(screen.getByLabelText('Día del aviso'), '18');
    await user.click(screen.getByRole('button', { name: 'Crear meta' }));

    await waitFor(() =>
      expect(props.onSaveNotificationRules).toHaveBeenCalledWith(
        expect.objectContaining({
          goalReminder: { enabled: true, emailEnabled: true },
        })
      )
    );
  });

  it('CA-WI5.3 si falla el guardado global al crear, no se envía la meta y se avisa', async () => {
    const user = userEvent.setup();
    const onSaveNotificationRules = vi.fn().mockRejectedValue(new Error('boom'));
    const props = renderDialog({ notificationRules: rulesOff, onSaveNotificationRules });

    await user.click(toggle());
    await user.click(await screen.findByRole('button', { name: 'Solo en la app' }));
    await fillBasics(user);
    await user.type(screen.getByLabelText('Día del aviso'), '18');
    await user.click(screen.getByRole('button', { name: 'Crear meta' }));

    expect(
      await screen.findByRole('alert', { name: 'Error al activar los avisos' })
    ).toHaveTextContent('No se pudo activar el aviso global. Revisa tus preferencias.');
    expect(props.onSubmit).not.toHaveBeenCalled();
    expect(toggle()).not.toBeChecked();
  });

  it('CA-WI5.1 editar una meta carga su toggle, día e importe', () => {
    const goal: SavingsGoal = {
      id: 'goal-1',
      name: 'Coche',
      targetAmount: 5000,
      targetDate: null,
      accountId: 'account-1',
      account: savingsAccount,
      isArchived: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      reminderDay: 5,
      reminderAmount: 250,
      reminderEnabled: true,
      saved: 1000,
      progress: 20,
      remaining: 4000,
      monthlyNeeded: 400,
      contributionsCount: 3,
    };
    renderDialog({ goal });

    expect(toggle()).toBeChecked();
    expect(screen.getByLabelText('Día del aviso')).toHaveValue(5);
    expect(screen.getByLabelText('Importe sugerido (€)')).toHaveValue(250);
  });

  it('conserva la fecha objetivo opcional con su tooltip', () => {
    renderDialog();

    const hint = screen.getByText(
      'Opcional: si la dejas vacía, la meta no tendrá fecha límite.'
    );
    expect(
      screen.getByLabelText('Más información sobre la fecha objetivo')
    ).toHaveAttribute('aria-describedby', hint.id);
    expect(screen.getByLabelText('Fecha objetivo')).not.toBeRequired();
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
