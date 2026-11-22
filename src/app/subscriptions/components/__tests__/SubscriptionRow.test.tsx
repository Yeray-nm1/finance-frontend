import { afterEach, describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubscriptionRow } from '../SubscriptionRow';
import type { Subscription } from '@/types/subscriptions';

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() { /* noop */ }
    unobserve() { /* noop */ }
    disconnect() { /* noop */ }
  };
});

afterEach(() => {
  vi.useRealTimers();
});

function buildSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'sub-1',
    userId: 'user-1',
    name: 'Netflix',
    amount: 9.99,
    frequency: 'monthly',
    matchDescriptions: [],
    amountTolerance: 10,
    active: true,
    createdAt: new Date(2026, 0, 1).toISOString(),
    ...overrides,
  };
}

function buildProps(subscription = buildSubscription()) {
  return {
    subscription,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggleActive: vi.fn(),
    onHistory: vi.fn(),
  };
}

describe('SubscriptionRow', () => {
  it('shows the annual cost and next charge', () => {
    render(<SubscriptionRow {...buildProps()} />);

    expect(screen.getAllByText(/119,88/).length).toBeGreaterThan(0);
    expect(screen.getByText('Coste anual')).toBeInTheDocument();
    expect(screen.getByText('Próximo cobro')).toBeInTheDocument();
  });

  it('toggles the subscription directly from the row', async () => {
    const user = userEvent.setup();
    const props = buildProps();
    render(<SubscriptionRow {...props} />);

    const toggle = screen.getByRole('switch', { name: /desactivar netflix/i });
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    await user.click(toggle);
    expect(props.onToggleActive).toHaveBeenCalledOnce();
  });

  it('marks cancelled subscriptions and allows reactivation', async () => {
    const user = userEvent.setup();
    const props = buildProps(buildSubscription({ active: false }));
    render(<SubscriptionRow {...props} />);

    expect(screen.getByText('Cancelada')).toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: /activar netflix/i }));
    expect(props.onToggleActive).toHaveBeenCalledOnce();
  });

  it('opens the payment history and edit/delete actions from the dots menu', async () => {
    const user = userEvent.setup();
    const props = buildProps();
    render(<SubscriptionRow {...props} />);

    await user.click(screen.getByRole('button', { name: /historial/i }));
    await user.click(screen.getByRole('button', { name: /más acciones para netflix/i }));
    await user.click(screen.getByRole('menuitem', { name: /editar netflix/i }));
    await user.click(screen.getByRole('button', { name: /más acciones para netflix/i }));
    await user.click(screen.getByRole('menuitem', { name: /eliminar netflix/i }));

    expect(props.onHistory).toHaveBeenCalledOnce();
    expect(props.onEdit).toHaveBeenCalledOnce();
    expect(props.onDelete).toHaveBeenCalledOnce();
  });

  it('muestra la inicial de la suscripción y el último cobro', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 21, 12));

    render(
      <SubscriptionRow
        {...buildProps(
          buildSubscription({
            lastTransaction: {
              id: 'tx-1',
              amount: -9.99,
              date: new Date(2026, 9, 27).toISOString(),
              description: 'Netflix',
            },
          })
        )}
      />
    );

    expect(screen.getByText('N')).toBeInTheDocument();
    expect(screen.getByText(/Último cobro 27 Oct/i)).toBeInTheDocument();
  });

  it('indica cuántos días quedan para el próximo cobro', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 21, 12));

    render(
      <SubscriptionRow
        {...buildProps(
          buildSubscription({
            frequency: 'weekly',
            lastTransaction: {
              id: 'tx-1',
              amount: -9.99,
              date: new Date(2026, 10, 21).toISOString(),
              description: 'Netflix',
            },
          })
        )}
      />
    );

    expect(screen.getByText(/28 Nov · en 7 días/i)).toBeInTheDocument();
  });
});
