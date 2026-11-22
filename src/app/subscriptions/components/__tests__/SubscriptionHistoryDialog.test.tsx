import { afterEach, describe, it, expect, vi, beforeAll } from 'vitest';
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

afterEach(() => {
  vi.useRealTimers();
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
  it('muestra el resumen y los pagos con fecha y importe', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 21, 12));

    render(
      <SubscriptionHistoryDialog
        subscription={subscription}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByText(/historial · netflix/i)).toBeInTheDocument();
    expect(screen.getByText('Últimos pagos vinculados')).toBeInTheDocument();
    expect(screen.getByText('15 mar 2026')).toBeInTheDocument();
    expect(screen.getByText('15 feb 2026')).toBeInTheDocument();
    expect(screen.getAllByText(/12,99/)).not.toHaveLength(0);

    expect(screen.getByText('Pagos').parentElement).toHaveTextContent('2');
    expect(screen.getByText('En total').parentElement).toHaveTextContent('22,98 €');
    expect(screen.getByText('Importe medio').parentElement).toHaveTextContent('11,49 €');
  });

  it('avisa de los cobros antiguos con la fecha del último pago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 21, 12));

    render(
      <SubscriptionHistoryDialog
        subscription={subscription}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByText(/Sin cobros desde el 15 mar/i)).toBeInTheDocument();
  });

  it('solo la lista de cobros tiene scroll vertical', () => {
    render(
      <SubscriptionHistoryDialog
        subscription={subscription}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    const list = screen.getByTestId('history-payment-list');
    expect(list.className).toContain('overflow-y-auto');
    expect(list.className).toContain('scrollbar-thin');
    expect(list).toHaveTextContent('15 mar 2026');
    expect(list).not.toHaveTextContent('Historial');
    expect(list).not.toHaveTextContent('Cerrar');

    const content = list.closest('[data-slot="dialog-content"]');
    expect(content?.className).not.toContain('overflow-y-auto');
    expect(content?.className).toContain('overflow-hidden');
  });

  it('no muestra el aviso cuando el último cobro es reciente', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 21, 12));

    render(
      <SubscriptionHistoryDialog
        subscription={{
          ...subscription,
          recentTransactions: [
            {
              id: 'tx-new',
              amount: -9.99,
              date: new Date(2026, 10, 7).toISOString(),
              description: 'Netflix',
            },
          ],
        }}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.queryByText(/Sin cobros desde/i)).not.toBeInTheDocument();
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

  it('cierra el diálogo con la X y con el botón inferior', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <SubscriptionHistoryDialog
        subscription={subscription}
        open={true}
        onOpenChange={onOpenChange}
      />
    );

    const closeButtons = screen.getAllByRole('button', { name: 'Cerrar' });
    expect(closeButtons).toHaveLength(2);

    await user.click(closeButtons[0]);
    await user.click(closeButtons[1]);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
