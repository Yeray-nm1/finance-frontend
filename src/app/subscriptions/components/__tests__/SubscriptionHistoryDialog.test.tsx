import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubscriptionHistoryDialog } from '../SubscriptionHistoryDialog';
import type { Subscription } from '@/types/subscriptions';

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() { /* noop */ }
    unobserve() { /* noop */ }
    disconnect() { /* noop */ }
  };
});

const subscription: Subscription = {
  id: 'sub-1',
  userId: 'user-1',
  name: 'Netflix',
  amount: 9.99,
  frequency: 'monthly',
  matchDescriptions: [],
  amountTolerance: 10,
  active: true,
  createdAt: new Date(2026, 0, 1).toISOString(),
  recentTransactions: [
    {
      id: 'tx-1',
      amount: -9.99,
      date: new Date(2026, 1, 15).toISOString(),
      description: 'Netflix',
    },
    {
      id: 'tx-2',
      amount: -12.99,
      date: new Date(2026, 2, 15).toISOString(),
      description: 'Netflix premium',
    },
  ],
};

describe('SubscriptionHistoryDialog', () => {
  it('lists the linked payments', () => {
    render(
      <SubscriptionHistoryDialog
        subscription={subscription}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByText(/historial · netflix/i)).toBeInTheDocument();
    expect(screen.getByText('Netflix premium')).toBeInTheDocument();
    expect(screen.getByText(/12,99/)).toBeInTheDocument();
  });

  it('shows an empty state without payments', () => {
    render(
      <SubscriptionHistoryDialog
        subscription={{ ...subscription, recentTransactions: [] }}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByText(/sin pagos vinculados/i)).toBeInTheDocument();
  });

  it('closes the dialog', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <SubscriptionHistoryDialog
        subscription={subscription}
        open={true}
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByRole('button', { name: /cerrar/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
