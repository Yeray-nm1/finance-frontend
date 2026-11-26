import { afterEach, beforeAll, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubscriptionHistoryDialog } from '../SubscriptionHistoryDialog';
import type { Subscription } from '@/types/subscriptions';

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: [], total: 0 }),
  }));
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
  kind: 'subscription',
  estimated: false,
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

function renderDialog(overrides: Partial<Subscription> = {}) {
  return render(
    <SubscriptionHistoryDialog
      subscription={{ ...subscription, ...overrides }}
      open
      onOpenChange={vi.fn()}
      onChanged={vi.fn()}
    />
  );
}

describe('SubscriptionHistoryDialog', () => {
  it('muestra el aviso de vinculación y los pagos con fecha, importe y Desvincular', () => {
    renderDialog();

    expect(screen.getByRole('heading', { name: /Historial · Netflix/i })).toBeInTheDocument();
    expect(screen.getByText('Pagos vinculados a esta suscripción')).toBeInTheDocument();
    expect(screen.getByText(/¿Falta algún pago\?/)).toBeInTheDocument();
    expect(screen.getByText('15 mar 2026')).toBeInTheDocument();
    expect(screen.getByText('15 feb 2026')).toBeInTheDocument();
    expect(screen.getAllByText(/12,99/)).not.toHaveLength(0);
    expect(screen.getAllByRole('button', { name: /Desvincular/i })).toHaveLength(2);
  });

  it('solo la lista de cobros tiene scroll vertical', () => {
    renderDialog();

    const list = screen.getByTestId('history-payment-list');
    expect(list.className).toContain('overflow-y-auto');
    expect(list.className).toContain('scrollbar-thin');
    expect(list).toHaveTextContent('15 mar 2026');
    expect(list).not.toHaveTextContent('Movimientos sin vincular');

    const content = list.closest('[data-slot="dialog-content"]');
    expect(content?.className).not.toContain('overflow-y-auto');
    expect(content?.className).toContain('overflow-hidden');
  });

  it('muestra el estado vacío cuando no hay pagos vinculados', () => {
    renderDialog({ recentTransactions: [] });

    expect(screen.getByText(/sin pagos vinculados/i)).toBeInTheDocument();
  });

  it('cierra el diálogo con la X y con el botón inferior', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <SubscriptionHistoryDialog
        subscription={subscription}
        open
        onOpenChange={onOpenChange}
        onChanged={vi.fn()}
      />
    );

    const closeButtons = screen.getAllByRole('button', { name: 'Cerrar' });
    expect(closeButtons).toHaveLength(2);

    await user.click(closeButtons[0]);
    await user.click(closeButtons[1]);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
