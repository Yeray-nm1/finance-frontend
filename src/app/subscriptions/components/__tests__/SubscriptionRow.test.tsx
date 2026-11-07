import { describe, it, expect, vi, beforeAll } from 'vitest';
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
    expect(screen.getByText('Proximo cobro')).toBeInTheDocument();
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

  it('opens the payment history and edit/delete actions', async () => {
    const user = userEvent.setup();
    const props = buildProps();
    render(<SubscriptionRow {...props} />);

    await user.click(screen.getByRole('button', { name: /historial/i }));
    await user.click(screen.getByRole('button', { name: /editar netflix/i }));
    await user.click(screen.getByRole('button', { name: /eliminar netflix/i }));

    expect(props.onHistory).toHaveBeenCalledOnce();
    expect(props.onEdit).toHaveBeenCalledOnce();
    expect(props.onDelete).toHaveBeenCalledOnce();
  });
});
