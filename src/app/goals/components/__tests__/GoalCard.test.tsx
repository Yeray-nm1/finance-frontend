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
  reminderFrequency: 'MONTHLY',
  reminderChannel: 'APP_ONLY',
  reminderWeekday: null,
  reminderDay: 18,
  reminderLastDay: false,
  reminderInterval: null,
  reminderIntervalUnit: null,
  reminderStartDate: null,
  reminderAmount: 100,
  reminderEnabled: false,
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

function renderCard(overrides: {
  goal?: SavingsGoal;
  reminderGloballyEnabled?: boolean;
} = {}) {
  return render(
    <GoalCard
      goal={overrides.goal ?? goal}
      reminderGloballyEnabled={overrides.reminderGloballyEnabled ?? true}
      {...handlers}
    />
  );
}

describe('GoalCard', () => {
  it('shows the goal progress and remaining amount', () => {
    renderCard();

    expect(screen.getByRole('heading', { name: 'Viaje a Japón' })).toBeInTheDocument();
    expect(screen.getByText('Ahorro viaje').parentElement).toHaveTextContent(
      /250,00.*1\.000,00/
    );
    expect(screen.getByText(/250,00/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');
    expect(screen.getByText(/Faltan/)).toBeInTheDocument();
    expect(screen.getByText(/100,00.*mes/)).toBeInTheDocument();
    expect(screen.getByText(/jun 2027/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aportaciones (2)' })).toBeInTheDocument();
  });

  it('calls the card actions', async () => {
    const user = userEvent.setup();
    renderCard();

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
    renderCard({ goal: { ...goal, accountId: null, account: null } });

    expect(screen.getByText(/Sin cuenta de ahorro/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Aportar/ })).toBeDisabled();
  });

  it('marks archived goals and disables contributions', () => {
    renderCard({ goal: { ...goal, isArchived: true } });

    expect(screen.getByText('Archivada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Aportar/ })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Reactivar Viaje a Japón' })
    ).toBeInTheDocument();
  });

  it('exposes a data attribute for the archive animation', () => {
    const { container } = renderCard();

    expect(container.querySelector('[data-goal-card="goal-1"]')).toBeInTheDocument();
  });

  it('CA-WI5.5 muestra gris cuando la meta no tiene avisos', () => {
    renderCard({ goal: { ...goal, reminderEnabled: false }, reminderGloballyEnabled: false });

    const indicator = screen.getByRole('status', { name: 'Avisos de la meta desactivados' });
    expect(indicator).toHaveAttribute('data-reminder-state', 'off');
    expect(indicator).toHaveTextContent('Avisos desactivados');
  });

  it('CA-WI5.5 muestra verde cuando el global y la meta están activos', () => {
    renderCard({ goal: { ...goal, reminderEnabled: true }, reminderGloballyEnabled: true });

    const indicator = screen.getByRole('status', { name: 'Avisos de la meta activos' });
    expect(indicator).toHaveAttribute('data-reminder-state', 'on');
    expect(indicator).toHaveTextContent('Avisos activos');
  });

  it.each([
    ['on', true, true],
    ['off', false, false],
    ['pending', true, false],
  ])('2 el estado %s se muestra debajo del título', (state, reminderEnabled, globallyEnabled) => {
    renderCard({
      goal: { ...goal, reminderEnabled },
      reminderGloballyEnabled: globallyEnabled,
    });

    const heading = screen.getByRole('heading', { name: 'Viaje a Japón' });
    const indicator =
      state === 'pending'
        ? screen.getByRole('button', { name: 'Avisos pausados' })
        : screen.getByRole('status', {
            name:
              state === 'on'
                ? 'Avisos de la meta activos'
                : 'Avisos de la meta desactivados',
          });

    expect(
      heading.compareDocumentPosition(indicator) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(indicator.closest('div')).not.toBe(heading.parentElement);
  });

  it('2 el badge ámbar muestra motivo y enlace en tooltip, sin expansión al hacer clic', async () => {
    const user = userEvent.setup();
    renderCard({ goal: { ...goal, reminderEnabled: true }, reminderGloballyEnabled: false });

    const badge = screen.getByRole('button', { name: 'Avisos pausados' });
    expect(badge).toHaveAttribute('data-reminder-state', 'pending');
    expect(badge).not.toHaveAttribute('aria-expanded');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await user.hover(badge);

    const tooltip = screen.getByRole('tooltip');
    expect(badge).toHaveAttribute('aria-describedby', tooltip.id);
    expect(tooltip).toHaveTextContent(
      'Esta meta tiene el aviso encendido, pero el interruptor global de Preferencias está apagado.'
    );
    expect(screen.getByRole('link', { name: /Abrir Preferencias/ })).toHaveAttribute(
      'href',
      '/preferences?focus=goalReminder'
    );

    await user.unhover(badge);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await user.click(badge);
    expect(badge).not.toHaveAttribute('aria-expanded');
    expect(screen.getByRole('tooltip')).toBeVisible();
  });

  it('2 el tooltip aparece con el foco y sigue visible al pasar al enlace', async () => {
    const user = userEvent.setup();
    renderCard({ goal: { ...goal, reminderEnabled: true }, reminderGloballyEnabled: false });

    const badge = screen.getByRole('button', { name: 'Avisos pausados' });
    badge.focus();

    expect(await screen.findByRole('tooltip')).toBeVisible();

    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole('link', { name: /Abrir Preferencias/ })
    );
    expect(screen.getByRole('tooltip')).toBeVisible();
  });
});
