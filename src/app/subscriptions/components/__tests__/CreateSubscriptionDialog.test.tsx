import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateSubscriptionDialog } from '../CreateSubscriptionDialog';

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() { /* noop */ }
    unobserve() { /* noop */ }
    disconnect() { /* noop */ }
  };
});

vi.mock('@/lib/api', () => ({
  api: {
    subscriptions: {
      create: vi.fn(),
      confirmMatch: vi.fn(),
      list: vi.fn(),
    },
  },
}));

import { api } from '@/lib/api';

const mockCreate = api.subscriptions.create as ReturnType<typeof vi.fn>;
const mockConfirmMatch = api.subscriptions.confirmMatch as ReturnType<typeof vi.fn>;

function mockTransactionSearch(results: Array<{ id: string; description: string; amount: number; date: string }>) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: results, total: results.length }),
  }));
}

function mockTransactionSearchError() {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
}

describe('CreateSubscriptionDialog - Step 1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({ id: '1', name: 'Netflix', amount: 9.99, frequency: 'monthly' });
  });

  it('A1: shows step 1 with name, amount, frequency fields when open', () => {
    render(
      <CreateSubscriptionDialog
        open={true}
        onOpenChange={vi.fn()}
        onCreated={vi.fn()}
        existingNames={[]}
      />
    );

    expect(screen.getByText('Nueva Suscripcion')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByLabelText('Importe')).toBeInTheDocument();
    expect(screen.getByText('Mensual')).toBeInTheDocument();
  });

  it('A2: "Siguiente" button is disabled when name or amount are empty', () => {
    render(
      <CreateSubscriptionDialog
        open={true}
        onOpenChange={vi.fn()}
        onCreated={vi.fn()}
        existingNames={[]}
      />
    );

    const nextButton = screen.getByRole('button', { name: /siguiente/i });
    expect(nextButton).toBeDisabled();
  });

  it('A2b: "Siguiente" is enabled when name and amount are filled', async () => {
    const user = userEvent.setup();
    render(
      <CreateSubscriptionDialog
        open={true}
        onOpenChange={vi.fn()}
        onCreated={vi.fn()}
        existingNames={[]}
      />
    );

    const nameInput = screen.getByLabelText('Nombre');
    const amountInput = screen.getByLabelText('Importe');

    await user.type(nameInput, 'Netflix');
    await user.type(amountInput, '9.99');

    const nextButton = screen.getByRole('button', { name: /siguiente/i });
    expect(nextButton).not.toBeDisabled();
  });

  it('A3: clicking "Siguiente" with valid fields goes to step 2', async () => {
    const user = userEvent.setup();
    mockTransactionSearch([]);
    render(
      <CreateSubscriptionDialog
        open={true}
        onOpenChange={vi.fn()}
        onCreated={vi.fn()}
        existingNames={[]}
      />
    );

    await user.type(screen.getByLabelText('Nombre'), 'Netflix');
    await user.type(screen.getByLabelText('Importe'), '9.99');
    await user.click(screen.getByRole('button', { name: /siguiente/i }));

    await waitFor(() => {
      expect(screen.getByText(/vincular transacciones/i)).toBeInTheDocument();
    });
  });

  it('A4: clicking "Cancelar" calls onOpenChange(false)', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <CreateSubscriptionDialog
        open={true}
        onOpenChange={onOpenChange}
        onCreated={vi.fn()}
        existingNames={[]}
      />
    );

    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('CreateSubscriptionDialog - Step 2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({ id: '1', name: 'Netflix', amount: 9.99, frequency: 'monthly' });
  });

  it('A5: shows candidate transactions after clicking "Buscar transacciones"', async () => {
    const user = userEvent.setup();
    mockTransactionSearch([
      { id: 'tx-1', description: 'NETFLIX COM', amount: 9.99, date: '2026-05-02' },
      { id: 'tx-2', description: 'NETFLIX COM', amount: 9.99, date: '2026-04-02' },
    ]);
    render(
      <CreateSubscriptionDialog
        open={true}
        onOpenChange={vi.fn()}
        onCreated={vi.fn()}
        existingNames={[]}
      />
    );

    await user.type(screen.getByLabelText('Nombre'), 'Netflix');
    await user.type(screen.getByLabelText('Importe'), '9.99');
    await user.click(screen.getByRole('button', { name: /siguiente/i }));

    await waitFor(() => {
      expect(screen.getByText(/vincular transacciones/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /buscar transacciones/i }));

    await waitFor(() => {
      expect(screen.getAllByText('NETFLIX COM')).toHaveLength(2);
    });
  });

  it('A6: shows hint text before any search', async () => {
    const user = userEvent.setup();
    mockTransactionSearch([]);
    render(
      <CreateSubscriptionDialog
        open={true}
        onOpenChange={vi.fn()}
        onCreated={vi.fn()}
        existingNames={[]}
      />
    );

    await user.type(screen.getByLabelText('Nombre'), 'Netflix');
    await user.type(screen.getByLabelText('Importe'), '9.99');
    await user.click(screen.getByRole('button', { name: /siguiente/i }));

    await waitFor(() => {
      expect(screen.getByText(/pulsa.*buscar transacciones/i)).toBeInTheDocument();
    });
  });

  it('A7: "Atrás" returns to step 1 preserving form data', async () => {
    const user = userEvent.setup();
    mockTransactionSearch([]);
    render(
      <CreateSubscriptionDialog
        open={true}
        onOpenChange={vi.fn()}
        onCreated={vi.fn()}
        existingNames={[]}
      />
    );

    await user.type(screen.getByLabelText('Nombre'), 'Netflix');
    await user.type(screen.getByLabelText('Importe'), '9.99');
    await user.click(screen.getByRole('button', { name: /siguiente/i }));

    await waitFor(() => {
      expect(screen.getByText(/vincular transacciones/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /atras/i }));

    await waitFor(() => {
      expect(screen.getByText('Nueva Suscripcion')).toBeInTheDocument();
    });
    const nameInput = screen.getByLabelText('Nombre') as HTMLInputElement;
    expect(nameInput.value).toBe('Netflix');
  });

  it('A8: "Crear" without linking creates subscription without confirmMatch', async () => {
    const user = userEvent.setup();
    mockTransactionSearch([]);
    const onCreated = vi.fn();

    render(
      <CreateSubscriptionDialog
        open={true}
        onOpenChange={vi.fn()}
        onCreated={onCreated}
        existingNames={[]}
      />
    );

    await user.type(screen.getByLabelText('Nombre'), 'Netflix');
    await user.type(screen.getByLabelText('Importe'), '9.99');
    await user.click(screen.getByRole('button', { name: /siguiente/i }));

    await waitFor(() => {
      expect(screen.getByText(/vincular transacciones/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^crear$/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'Netflix',
        amount: 9.99,
        frequency: 'monthly',
      });
      expect(mockConfirmMatch).not.toHaveBeenCalled();
      expect(onCreated).toHaveBeenCalled();
    });
  });

  it('A9: "Crear" with linked transactions calls confirmMatch for each', async () => {
    const user = userEvent.setup();
    mockTransactionSearch([
      { id: 'tx-1', description: 'NETFLIX COM', amount: 9.99, date: '2026-05-02' },
    ]);
    const onCreated = vi.fn();

    render(
      <CreateSubscriptionDialog
        open={true}
        onOpenChange={vi.fn()}
        onCreated={onCreated}
        existingNames={[]}
      />
    );

    await user.type(screen.getByLabelText('Nombre'), 'Netflix');
    await user.type(screen.getByLabelText('Importe'), '9.99');
    await user.click(screen.getByRole('button', { name: /siguiente/i }));

    await waitFor(() => {
      expect(screen.getByText(/vincular transacciones/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /buscar transacciones/i }));

    await waitFor(() => {
      expect(screen.getByText('NETFLIX COM')).toBeInTheDocument();
    });

    const vincularBtn = screen.getByRole('button', { name: /^vincular$/i });
    await user.click(vincularBtn);
    await user.click(screen.getByRole('button', { name: /^crear$/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'NETFLIX COM',
        amount: 9.99,
        frequency: 'monthly',
      });
      expect(mockConfirmMatch).toHaveBeenCalledWith('1', 'NETFLIX COM', 'tx-1');
      expect(onCreated).toHaveBeenCalled();
    });
  });

  it('A10: shows loading indicator while searching candidates', async () => {
    const user = userEvent.setup();
    render(
      <CreateSubscriptionDialog
        open={true}
        onOpenChange={vi.fn()}
        onCreated={vi.fn()}
        existingNames={[]}
      />
    );

    await user.type(screen.getByLabelText('Nombre'), 'Netflix');
    await user.type(screen.getByLabelText('Importe'), '9.99');
    await user.click(screen.getByRole('button', { name: /siguiente/i }));

    await waitFor(() => {
      expect(screen.getByText(/vincular transacciones/i)).toBeInTheDocument();
    });

    mockTransactionSearch([]);
    await user.click(screen.getByRole('button', { name: /buscar transacciones/i }));

    await waitFor(() => {
      expect(screen.getByText(/pulsa.*buscar transacciones/i)).toBeInTheDocument();
    });
  });

  it('A11: shows error when search fails and allows continuing', async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();

    render(
      <CreateSubscriptionDialog
        open={true}
        onOpenChange={vi.fn()}
        onCreated={onCreated}
        existingNames={[]}
      />
    );

    await user.type(screen.getByLabelText('Nombre'), 'Netflix');
    await user.type(screen.getByLabelText('Importe'), '9.99');
    await user.click(screen.getByRole('button', { name: /siguiente/i }));

    await waitFor(() => {
      expect(screen.getByText(/vincular transacciones/i)).toBeInTheDocument();
    });

    mockTransactionSearchError();
    await user.click(screen.getByRole('button', { name: /buscar transacciones/i }));

    await waitFor(() => {
      expect(screen.getByText(/error al buscar/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^crear$/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
      expect(onCreated).toHaveBeenCalled();
    });
  });
});
