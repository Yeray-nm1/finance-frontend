import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateSubscriptionDialog } from '../CreateSubscriptionDialog';

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

vi.mock('@/lib/api', () => ({
  api: {
    subscriptions: {
      create: vi.fn(),
      confirmMatch: vi.fn(),
    },
  },
}));

import { api } from '@/lib/api';

const mockCreate = api.subscriptions.create as ReturnType<typeof vi.fn>;
const mockConfirmMatch = api.subscriptions.confirmMatch as ReturnType<typeof vi.fn>;

function mockTransactionSearch(results: Array<{ id: string; description: string; amount: number; date: string }> = []) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: results, total: results.length }),
  }));
}

function renderDialog(existingNames: string[] = []) {
  return render(
    <CreateSubscriptionDialog
      open
      onOpenChange={vi.fn()}
      onCreated={vi.fn()}
      existingNames={existingNames}
    />
  );
}

async function fillStep1(user: ReturnType<typeof userEvent.setup>, name = 'Netflix', amount = '9.99') {
  await user.type(screen.getByLabelText('Nombre'), name);
  await user.type(screen.getByLabelText('Importe'), amount);
  await user.click(screen.getByRole('button', { name: /Siguiente: pagos anteriores/ }));
  await screen.findByText(/Hemos buscado movimientos parecidos/);
}

describe('CreateSubscriptionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({ id: '1' });
    mockTransactionSearch();
  });

  it('muestra nombre, importe, frecuencia y próximo cobro en el paso 1', () => {
    renderDialog();

    expect(screen.getByRole('heading', { name: 'Nueva suscripción' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByLabelText('Importe')).toBeInTheDocument();
    expect(screen.getByLabelText('Frecuencia')).toBeInTheDocument();
    expect(screen.getByLabelText('Próximo cobro')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Siguiente: pagos anteriores/ })).toBeDisabled();
  });

  it('el botón Siguiente se habilita con nombre e importe', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText('Nombre'), 'Netflix');
    await user.type(screen.getByLabelText('Importe'), '9.99');

    expect(screen.getByRole('button', { name: /Siguiente: pagos anteriores/ })).not.toBeDisabled();
  });

  it('busca movimientos parecidos al llegar al paso 2', async () => {
    const user = userEvent.setup();
    mockTransactionSearch([
      { id: 'tx-1', description: 'NETFLIX COM', amount: -9.99, date: '2026-05-02T00:00:00.000Z' },
    ]);
    renderDialog();

    await fillStep1(user);

    expect(screen.getByText('NETFLIX COM')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /NETFLIX COM/ })).toBeChecked();
  });

  it('"Atrás" vuelve al paso 1 conservando los datos', async () => {
    const user = userEvent.setup();
    renderDialog();

    await fillStep1(user);
    await user.click(screen.getByRole('button', { name: /Atrás/ }));

    expect(screen.getByLabelText('Nombre')).toHaveValue('Netflix');
  });

  it('crea la suscripción sin vincular pagos', async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    render(
      <CreateSubscriptionDialog open onOpenChange={vi.fn()} onCreated={onCreated} existingNames={[]} />
    );

    await fillStep1(user);
    await user.click(screen.getByRole('button', { name: /Guardar sin vincular pagos/ }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Netflix',
        amount: 9.99,
        frequency: 'monthly',
        kind: 'subscription',
        estimated: false,
      }));
      expect(mockConfirmMatch).not.toHaveBeenCalled();
      expect(onCreated).toHaveBeenCalled();
    });
  });

  it('crea y vincula los movimientos seleccionados', async () => {
    const user = userEvent.setup();
    mockTransactionSearch([
      { id: 'tx-1', description: 'NETFLIX COM', amount: -9.99, date: '2026-05-02T00:00:00.000Z' },
    ]);
    renderDialog();

    await fillStep1(user);
    await user.click(screen.getByRole('button', { name: /Guardar con 1 pago/ }));

    await waitFor(() => {
      expect(mockConfirmMatch).toHaveBeenCalledWith('1', 'NETFLIX COM', 'tx-1');
    });
  });

  it('muestra el error de búsqueda y permite guardar igualmente', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    renderDialog();

    await fillStep1(user);
    expect(screen.getByText(/Error al buscar transacciones/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Guardar sin vincular pagos/ }));
    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
  });

  it('permite crear un pago recurrente con importe estimado', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('radio', { name: /Pago recurrente/ }));
    await user.click(screen.getByRole('checkbox', { name: /Importe estimado/ }));
    await fillStep1(user, 'Alquiler piso', '650');
    await user.click(screen.getByRole('button', { name: /Guardar sin vincular pagos/ }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        kind: 'recurring',
        estimated: true,
      }));
    });
  });
});
