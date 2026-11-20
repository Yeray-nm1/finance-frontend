import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GoalDialog } from '../GoalDialog';
import type { Account } from '@/types/accounts';
import type { NotificationRules } from '@/types/notifications';
import type { SavingsGoal } from '@/types/goals';

const savingsAccount: Account = {
  id: 'account-1',
  userId: 'user-1',
  name: 'Ahorro viaje',
  type: 'savings',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const rules: NotificationRules = {
  subscriptionDue: { enabled: false, emailEnabled: false, daysBefore: 3 },
  spendingSummary: { enabled: false, emailEnabled: false, frequency: 'monthly' },
  goalReminder: { enabled: true, emailEnabled: true },
};

function renderDialog(overrides: Partial<React.ComponentProps<typeof GoalDialog>> = {}) {
  const props = {
    open: true,
    goal: null,
    accounts: [savingsAccount],
    saving: false,
    notificationRules: rules,
    onSaveNotificationRules: vi.fn().mockResolvedValue(undefined),
    onOpenChange: vi.fn(),
    onSubmit: vi.fn(),
    onAccountCreated: vi.fn(),
    ...overrides,
  };
  render(<GoalDialog {...props} />);
  return props;
}

function goal(overrides: Partial<SavingsGoal> = {}): SavingsGoal {
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

async function fillBasics(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nombre'), 'Viaje a Japón');
  await user.type(screen.getByLabelText('Objetivo (€)'), '1200');
}

async function enableReminder(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('switch', { name: 'Recordatorio de aportación' }));
}

async function choose(user: ReturnType<typeof userEvent.setup>, name: string, option: string) {
  await user.click(screen.getByRole('combobox', { name }));
  await user.click(await screen.findByRole('option', { name: option }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GoalDialog · modal compacta de frecuencias', () => {
  it('CA-22 replica el nodo 8:91 de Figma: 515 px, borde #e2e8f0, radio 16 px y pie fijo', () => {
    renderDialog();

    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('w-[515px]');
    expect(dialog.className).toContain('border-[#e2e8f0]');
    expect(dialog.className).toContain('rounded-[16px]');
    expect(dialog.querySelector('[data-slot="dialog-description"]')).toBeNull();
    expect(screen.getByText('Nombre', { exact: true })).toHaveClass('text-[12px]');
    expect(screen.getByLabelText('Nombre')).toHaveClass('py-[9px]');
    expect(screen.getByLabelText('Objetivo (€)')).toHaveClass('rounded-[8px]');
    expect(screen.getByRole('button', { name: 'Crear meta' })).toHaveClass('bg-[#2b6cb0]');
    expect(dialog.querySelector('.overflow-y-auto')).not.toBeNull();
  });

  it('CA-22 el contenedor anula el sm:p-6 de 24px del DialogContent base', () => {
    renderDialog();

    const dialog = screen.getByRole('dialog');
    const header = dialog.querySelector('[data-slot="dialog-header"]');
    const body = dialog.querySelector('.overflow-y-auto');
    const footer = screen.getByRole('button', { name: 'Crear meta' }).closest('form')
      ?.lastElementChild;

    // El DialogContent base añade p-5 sm:p-6 (24px en escritorio); la modal debe anularlo
    // en ambos breakpoints para que los 20px de cabecera/cuerpo/pie sean los únicos.
    expect(dialog).toHaveClass('p-0', 'sm:p-0');
    expect(header).toHaveClass('px-[20px]');
    expect(body).toHaveClass('px-[20px]');
    expect(footer).toHaveClass('px-[20px]');
    expect(body).toHaveClass('space-y-[14px]');
  });

  it('CA-22 el recordatorio usa el recuadro gris exacto de Figma y no ofrece último día', async () => {
    const user = userEvent.setup();
    renderDialog();
    await enableReminder(user);

    const reminder = screen.getByText('Recordatorio de aportación').closest('section');
    expect(reminder).toHaveClass('bg-[#f8fafc]');
    expect(reminder).toHaveClass('border-[#e2e8f0]');
    expect(reminder).toHaveClass('rounded-[10px]');
    expect(screen.queryByLabelText('Usar el último día del mes')).not.toBeInTheDocument();
  });

  it('CA-22 el resumen va al final del recordatorio en azul #1e4e80', async () => {
    const user = userEvent.setup();
    renderDialog();
    await enableReminder(user);

    const summary = screen.getByText('Te avisaremos el día 1 de cada mes, en la app y por email.');
    const amount = screen.getByText('Importe sugerido (€)');
    const reminder = screen.getByText('Recordatorio de aportación').closest('section');
    expect(reminder).toContainElement(summary);
    expect(summary.compareDocumentPosition(amount) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    expect(summary).toHaveClass('text-[#1e4e80]');
  });

  it('CA-22 el «Cómo funciona» es un tooltip junto al interruptor', async () => {
    const user = userEvent.setup();
    renderDialog();
    await enableReminder(user);

    const info = screen.getByLabelText('Cómo funciona');
    const hint = screen.getByText(
      'El aviso llegará en la frecuencia elegida. Podrás decidir cuánto aportar al confirmarlo y, si quieres, actualizar la sugerencia para las próximas ocasiones.'
    );
    expect(info).toHaveAttribute('aria-describedby', hint.id);
    await user.hover(info);
    expect(hint).toBeVisible();
  });

  it('CA-22 en mensual el día del mes y el importe sugerido comparten fila en escritorio y se apilan en móvil', async () => {
    const user = userEvent.setup();
    renderDialog();
    await enableReminder(user);

    const day = screen.getByLabelText('Día del mes');
    const amount = screen.getByLabelText('Importe sugerido (€)');
    const row = day.closest('.grid');

    expect(row).toBe(amount.closest('.grid'));
    expect(row).toHaveClass('grid-cols-1', 'sm:grid-cols-2');
  });

  it('CA-22 en personalizada la fila de intervalo y fecha se apila en móvil para no desbordar', async () => {
    const user = userEvent.setup();
    renderDialog();
    await enableReminder(user);
    await choose(user, 'Frecuencia', 'Personalizada');

    const interval = screen.getByLabelText('Repetir cada');
    const start = screen.getByLabelText('Empezar el');
    const row = interval.closest('.grid');

    expect(row).toBe(start.closest('.grid'));
    expect(row).toHaveClass('grid-cols-1', 'sm:grid-cols-2');
    expect(interval.parentElement).toHaveClass('min-w-0');
  });

  it('CA-22 el tooltip del recordatorio se saca del área con scroll mediante un portal', async () => {
    const user = userEvent.setup();
    renderDialog();
    await enableReminder(user);

    const info = screen.getByLabelText('Cómo funciona');
    const hint = screen.getByText(
      'El aviso llegará en la frecuencia elegida. Podrás decidir cuánto aportar al confirmarlo y, si quieres, actualizar la sugerencia para las próximas ocasiones.'
    );

    expect(screen.getByRole('dialog')).not.toContainElement(hint);
    expect(hint.parentElement).toBe(document.body);
    expect(hint).toHaveClass('fixed');
    await user.hover(info);
    expect(hint).toBeVisible();
  });

  it('CA-9 el bloque de avisos nace plegado, sin resumen ni controles', () => {
    renderDialog();

    expect(screen.getByRole('switch', { name: 'Recordatorio de aportación' })).not.toBeChecked();
    expect(screen.queryByRole('combobox', { name: 'Canal' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Te avisaremos/)).not.toBeInTheDocument();
  });

  it('CA-9 al activarlo aparecen canal, frecuencia y controles condicionales en una fila', async () => {
    const user = userEvent.setup();
    renderDialog();

    await enableReminder(user);

    expect(screen.getByRole('combobox', { name: 'Canal' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Frecuencia' })).toBeInTheDocument();
    expect(screen.getByLabelText('Día del mes')).toBeInTheDocument();
    expect(screen.getByLabelText('Importe sugerido (€)')).toHaveAttribute('placeholder', 'Opcional');
    expect(screen.getByText('Te avisaremos el día 1 de cada mes, en la app y por email.')).toBeVisible();
  });

  it('CA-10/CA-11 semanal usa la fila L-D y resume con Figma', async () => {
    const user = userEvent.setup();
    const props = renderDialog();

    await fillBasics(user);
    await enableReminder(user);
    await choose(user, 'Frecuencia', 'Semanal');
    expect(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].every(
      (day) => screen.getByRole('button', { name: day }) !== null
    )).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Viernes' }));

    expect(screen.getByRole('button', { name: 'Viernes' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Te avisaremos cada viernes, en la app y por email.')).toBeVisible();
    expect(screen.queryByLabelText('Día del mes')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Crear meta' }));

    await waitFor(() =>
      expect(props.onSubmit).toHaveBeenCalledWith({
        name: 'Viaje a Japón',
        targetAmount: 1200,
        targetDate: null,
        accountId: 'account-1',
        reminderEnabled: true,
        reminderFrequency: 'WEEKLY',
        reminderChannel: 'APP_AND_EMAIL',
        reminderWeekday: 5,
        reminderDay: null,
        reminderLastDay: false,
        reminderInterval: null,
        reminderIntervalUnit: null,
        reminderStartDate: null,
        reminderAmount: null,
      })
    );
  });

  it('CA-10/CA-11 mensual guarda el día del mes elegido', async () => {
    const user = userEvent.setup();
    const props = renderDialog();

    await fillBasics(user);
    await enableReminder(user);
    await user.type(screen.getByLabelText('Día del mes'), '15');

    expect(
      screen.getByText('Te avisaremos el día 15 de cada mes, en la app y por email.')
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Crear meta' }));

    await waitFor(() =>
      expect(props.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          reminderFrequency: 'MONTHLY',
          reminderDay: 15,
          reminderLastDay: false,
        })
      )
    );
  });

  it('CA-10/CA-11 personalizada envía intervalo, unidad y fecha', async () => {
    const user = userEvent.setup();
    const props = renderDialog();

    await fillBasics(user);
    await enableReminder(user);
    await choose(user, 'Frecuencia', 'Personalizada');
    await user.type(screen.getByLabelText('Repetir cada'), '2');
    await choose(user, 'Unidad del intervalo', 'semanas');
    await user.type(screen.getByLabelText('Empezar el'), '2026-12-05');

    expect(
      screen.getByText('Te avisaremos cada 2 semanas desde el 05/12/2026, en la app y por email.')
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Crear meta' }));

    await waitFor(() =>
      expect(props.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          reminderFrequency: 'CUSTOM',
          reminderInterval: 2,
          reminderIntervalUnit: 'WEEKS',
          reminderStartDate: '2026-12-05T00:00:00.000Z',
          reminderDay: null,
          reminderLastDay: false,
        })
      )
    );
  });

  it('CA-10 los campos incompletos bloquean el guardado', async () => {
    const user = userEvent.setup();
    renderDialog();

    await fillBasics(user);
    await enableReminder(user);
    const submit = screen.getByRole('button', { name: 'Crear meta' });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText('Día del mes'), '32');
    expect(submit).toBeDisabled();
    await user.clear(screen.getByLabelText('Día del mes'));
    await user.type(screen.getByLabelText('Día del mes'), '31');
    expect(submit).toBeEnabled();
  });

  it('CA-9 editar carga la programación y el resumen sin pulsar nada', () => {
    renderDialog({
      goal: goal({
        reminderFrequency: 'CUSTOM',
        reminderInterval: 3,
        reminderIntervalUnit: 'MONTHS',
        reminderStartDate: '2026-12-05T00:00:00.000Z',
        reminderDay: null,
      }),
    });

    expect(
      screen.getByText('Te avisaremos cada 3 meses desde el 05/12/2026, en la app y por email.')
    ).toBeVisible();
    expect(screen.getByRole('switch', { name: 'Recordatorio de aportación' })).toBeChecked();
  });

  it('CA-12 el canal elegido se guarda por meta y actualiza el global', async () => {
    const user = userEvent.setup();
    const props = renderDialog();

    await fillBasics(user);
    await enableReminder(user);
    await choose(user, 'Canal', 'Solo en la app');
    await user.type(screen.getByLabelText('Día del mes'), '18');
    await user.click(screen.getByRole('button', { name: 'Crear meta' }));

    await waitFor(() =>
      expect(props.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ reminderChannel: 'APP_ONLY' })
      )
    );
    await waitFor(() =>
      expect(props.onSaveNotificationRules).toHaveBeenCalledWith(
        expect.objectContaining({ goalReminder: { enabled: true, emailEnabled: false } })
      )
    );
  });
});
