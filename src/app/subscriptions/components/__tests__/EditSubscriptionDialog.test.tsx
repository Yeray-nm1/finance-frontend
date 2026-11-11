import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditSubscriptionDialog } from '../EditSubscriptionDialog';
import type { Subscription } from '@/types/subscriptions';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    subscriptions: {
      update: vi.fn().mockResolvedValue({}),
      unlinkTransactions: vi.fn(),
      confirmMatch: vi.fn(),
    },
  },
}));

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() { /* noop */ }
    unobserve() { /* noop */ }
    disconnect() { /* noop */ }
  };
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
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
};

function renderDialog() {
  return render(
    <EditSubscriptionDialog
      subscription={subscription}
      existingNames={[]}
      open={true}
      onOpenChange={vi.fn()}
      onSaved={vi.fn()}
    />
  );
}

describe('EditSubscriptionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves name, amount and frequency without overwriting the active flag', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: /siguiente/i }));
    await user.click(await screen.findByRole('button', { name: /^guardar$/i }));

    expect(api.subscriptions.update).toHaveBeenCalledWith(
      'sub-1',
      expect.objectContaining({ name: 'Netflix', amount: 9.99, frequency: 'monthly' })
    );
    const payload = vi.mocked(api.subscriptions.update).mock.calls[0][1];
    expect(payload).not.toHaveProperty('active');
  });

  it('does not render the active toggle inside the edit dialog', () => {
    renderDialog();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });
});
