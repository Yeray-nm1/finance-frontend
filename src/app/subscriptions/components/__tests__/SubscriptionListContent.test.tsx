import { useState } from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubscriptionListContent } from '../SubscriptionListContent';
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
    amount: 10,
    frequency: 'monthly',
    matchDescriptions: [],
    amountTolerance: 10,
    active: true,
    createdAt: new Date(2026, 0, 1).toISOString(),
    ...overrides,
  };
}

const activeSub = buildSubscription();
const cancelledSub = buildSubscription({
  id: 'sub-2',
  name: 'Spotify',
  amount: 100,
  active: false,
});

function buildProps(overrides: Record<string, unknown> = {}) {
  return {
    loading: false,
    error: null,
    subscriptions: [activeSub, cancelledSub],
    onRetry: vi.fn(),
    onDismissError: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggleActive: vi.fn(),
    onHistory: vi.fn(),
    onUpdateAmount: vi.fn(),
    onDismissPriceChange: vi.fn(),
    ...overrides,
  };
}

function Harness({ initial }: Readonly<{ initial: Subscription[] }>) {
  const [subscriptions, setSubscriptions] = useState(initial);

  return (
    <SubscriptionListContent
      {...buildProps({ subscriptions })}
      onToggleActive={(sub) =>
        setSubscriptions((prev) =>
          prev.map((item) =>
            item.id === sub.id ? { ...item, active: !item.active } : item
          )
        )
      }
    />
  );
}

describe('SubscriptionListContent', () => {
  it('separates active and cancelled subscriptions in tabs', async () => {
    const user = userEvent.setup();
    render(<SubscriptionListContent {...buildProps()} />);

    expect(screen.getByRole('tab', { name: /activas \(1\)/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /canceladas \(1\)/i })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.queryByText('Spotify')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /canceladas \(1\)/i }));

    expect(screen.getByText('Spotify')).toBeInTheDocument();
    expect(screen.getByText('Cancelada')).toBeInTheDocument();
    expect(screen.queryByText('Netflix')).not.toBeInTheDocument();
  });

  it('only adds active subscriptions to the annual total', () => {
    render(<SubscriptionListContent {...buildProps()} />);

    const summary = screen
      .getAllByText(/coste anual/i)
      .find((element) => element.tagName === 'P' && element.querySelector('span'));

    expect(summary).toHaveTextContent(/120,00/);
  });

  it('opens the history of the selected subscription', async () => {
    const user = userEvent.setup();
    const props = buildProps();
    render(<SubscriptionListContent {...props} />);

    await user.click(screen.getByRole('button', { name: /historial/i }));

    expect(props.onHistory).toHaveBeenCalledWith(activeSub);
  });

  it('keeps the Activas tab when cancelling the only active subscription', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[activeSub, cancelledSub]} />);

    const activeTab = screen.getByRole('tab', { name: 'Activas (1)' });
    expect(activeTab).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('switch', { name: 'Desactivar Netflix' }));

    expect(activeTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('No hay suscripciones activas.')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Canceladas (2)' })).toHaveAttribute(
      'aria-selected',
      'false'
    );
  });

  it('keeps the Canceladas tab when reactivating the only cancelled subscription', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[activeSub, cancelledSub]} />);

    await user.click(screen.getByRole('tab', { name: 'Canceladas (1)' }));
    const cancelledTab = screen.getByRole('tab', { name: 'Canceladas (1)' });
    expect(cancelledTab).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('switch', { name: 'Activar Spotify' }));

    expect(cancelledTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('No hay suscripciones canceladas.')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Activas (2)' })).toHaveAttribute(
      'aria-selected',
      'false'
    );
  });
});
