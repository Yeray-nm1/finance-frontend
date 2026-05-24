import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() { /* noop */ }
    unobserve() { /* noop */ }
    disconnect() { /* noop */ }
  };
});

let createDialogOnCreated: () => void = () => {};
const mockCreateDialog = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    subscriptions: {
      list: vi.fn().mockResolvedValue([
        { id: '1', name: 'Netflix', amount: 9.99, frequency: 'monthly' },
      ]),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('../components/CreateSubscriptionDialog', () => ({
  CreateSubscriptionDialog: vi.fn((props: { open: boolean; onOpenChange: (open: boolean) => void; onCreated: () => void }) => {
    createDialogOnCreated = props.onCreated;
    mockCreateDialog(props);
    return props.open ? <div data-testid="create-subscription-dialog">CreateSubscriptionDialog Mock</div> : null;
  }),
}));

vi.mock('../components/EditSubscriptionDialog', () => ({
  EditSubscriptionDialog: vi.fn(() => <div data-testid="edit-subscription-dialog" />),
}));

vi.mock('../components/DetectCandidatesModal', () => ({
  DetectCandidatesModal: vi.fn(() => <div data-testid="detect-candidates-modal" />),
}));

import SubscriptionsPage from '../page';

describe('SubscriptionsPage - CreateSubscriptionDialog integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('B1: clicking "Anadir" opens CreateSubscriptionDialog', async () => {
    const user = userEvent.setup();
    render(<SubscriptionsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /anadir/i });
    await user.click(addButton);

    expect(screen.getByTestId('create-subscription-dialog')).toBeInTheDocument();
  });

  it('B2: when dialog completes successfully, it closes and reloads subscription list', async () => {
    const user = userEvent.setup();
    render(<SubscriptionsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /anadir/i });
    await user.click(addButton);

    expect(screen.getByTestId('create-subscription-dialog')).toBeInTheDocument();

    createDialogOnCreated();

    await waitFor(() => {
      expect(mockCreateDialog).toHaveBeenLastCalledWith(
        expect.objectContaining({ open: false })
      );
    });
  });
});
