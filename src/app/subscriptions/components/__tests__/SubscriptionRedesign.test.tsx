import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateSubscriptionDialog } from '../CreateSubscriptionDialog';
import { EditSubscriptionDialog } from '../EditSubscriptionDialog';
import { SubscriptionHistoryDialog } from '../SubscriptionHistoryDialog';
import { getNextChargeDateFromPayments } from '@/lib/subscriptions';
import type { Subscription } from '@/types/subscriptions';

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
      update: vi.fn(),
      confirmMatch: vi.fn(),
      unlinkTransaction: vi.fn(),
    },
  },
}));

import { api } from '@/lib/api';

const mockCreate = api.subscriptions.create as ReturnType<typeof vi.fn>;
const mockUpdate = api.subscriptions.update as ReturnType<typeof vi.fn>;
const mockConfirmMatch = api.subscriptions.confirmMatch as ReturnType<typeof vi.fn>;
const mockUnlinkTransaction = api.subscriptions.unlinkTransaction as ReturnType<typeof vi.fn>;

function mockTransactionSearch(results: Array<{ id: string; description: string; amount: number; date: string; subscriptionId?: string | null }>) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: results, total: results.length }),
  }));
}

function dateInput(daysFromToday: number, day = 12): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  date.setDate(day);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toInputValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function baseSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'sub-1',
    userId: 'user-1',
    name: 'Netflix',
    amount: 11.99,
    frequency: 'monthly',
    kind: 'subscription',
    estimated: false,
    matchDescriptions: [],
    amountTolerance: 10,
    active: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreate.mockResolvedValue({ id: 'sub-new' });
  mockUpdate.mockResolvedValue({ id: 'sub-1' });
  mockConfirmMatch.mockResolvedValue({ id: 'sub-1' });
  mockUnlinkTransaction.mockResolvedValue({ unlinked: 1 });
  mockTransactionSearch([]);
});

describe('paso 1: datos', () => {
  it('muestra el indicador de pasos, los radios de tipo y el próximo cobro editable', () => {
    render(
      <CreateSubscriptionDialog open onOpenChange={vi.fn()} onCreated={vi.fn()} existingNames={[]} />
    );

    expect(screen.getByRole('heading', { name: 'Nueva suscripción' })).toBeInTheDocument();
    expect(screen.getByText('Paso 1 de 2')).toBeInTheDocument();
    expect(screen.getByText('Pagos anteriores · opcional')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Suscripción/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Pago recurrente/ })).not.toBeChecked();
    expect(screen.getByText('Servicio que contratas y puedes cancelar.')).toBeInTheDocument();
    expect(screen.getByText('Pago periódico que debes afrontar.')).toBeInTheDocument();
    expect((screen.getByLabelText('Próximo cobro') as HTMLInputElement).value).not.toBe('');
    expect(screen.getByRole('button', { name: /Siguiente: pagos anteriores/ })).toBeInTheDocument();
  });

  it('envía la fecha de próximo cobro elegida al crear', async () => {
    const user = userEvent.setup();
    render(
      <CreateSubscriptionDialog open onOpenChange={vi.fn()} onCreated={vi.fn()} existingNames={[]} />
    );

    await user.type(screen.getByLabelText('Nombre'), 'Disney+');
    await user.type(screen.getByLabelText('Importe'), '8.99');
    await user.clear(screen.getByLabelText('Próximo cobro'));
    await user.type(screen.getByLabelText('Próximo cobro'), '2027-04-03');
    await user.click(screen.getByRole('button', { name: /Siguiente: pagos anteriores/ }));

    await screen.findByText(/Hemos buscado movimientos parecidos/);
    await user.click(screen.getByRole('button', { name: /Guardar sin vincular pagos/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Disney+', nextChargeDate: '2027-04-03' })
      );
    });
  });

  it('rellena el próximo cobro desde el último pago al editar y permite cambiarlo', async () => {
    const user = userEvent.setup();
    const lastPaymentDate = dateInput(-40);
    const expected = toInputValue(getNextChargeDateFromPayments(
      [{ date: new Date(`${lastPaymentDate}T00:00:00`).toISOString() }],
      'monthly'
    )!);

    render(
      <EditSubscriptionDialog
        subscription={baseSubscription({
          lastTransaction: {
            id: 'tx-last',
            amount: -11.99,
            date: new Date(`${lastPaymentDate}T00:00:00`).toISOString(),
            description: 'NETFLIX',
          },
        })}
        existingNames={[]}
        open
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    expect((screen.getByLabelText('Próximo cobro') as HTMLInputElement).value).toBe(expected);

    await user.clear(screen.getByLabelText('Próximo cobro'));
    await user.type(screen.getByLabelText('Próximo cobro'), '2028-01-09');
    await user.click(screen.getByRole('button', { name: /Siguiente: pagos anteriores/ }));
    await screen.findByText(/Hemos buscado movimientos parecidos/);
    await user.click(screen.getByRole('button', { name: /Guardar sin vincular pagos/i }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        'sub-1',
        expect.objectContaining({ nextChargeDate: '2028-01-09' })
      );
    });
  });
});

describe('paso 2: pagos anteriores', () => {
  it('preselecciona los pagos del mismo importe y respeta los de importe distinto', async () => {
    const user = userEvent.setup();
    const paidDate = dateInput(-10);
    const expectedNext = getNextChargeDateFromPayments(
      [{ date: new Date(`${paidDate}T00:00:00`).toISOString() }],
      'monthly'
    )!;
    mockTransactionSearch([
      { id: 'tx-ok', description: 'DISNEY PLUS', amount: -8.99, date: new Date(`${paidDate}T00:00:00`).toISOString() },
      { id: 'tx-diff', description: 'DISNEY PLUS*PROMO', amount: -4.99, date: new Date(`${paidDate}T00:00:00`).toISOString() },
    ]);

    render(
      <CreateSubscriptionDialog open onOpenChange={vi.fn()} onCreated={vi.fn()} existingNames={[]} />
    );

    await user.type(screen.getByLabelText('Nombre'), 'Disney+');
    await user.type(screen.getByLabelText('Importe'), '8.99');
    await user.click(screen.getByRole('button', { name: /Siguiente: pagos anteriores/ }));

    await screen.findByText(/Hemos buscado movimientos parecidos a «Disney\+»/);
    const checkboxes = await screen.findAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(screen.getByText(/importe distinto/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Con este pago, el próximo cobro será el`))).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Guardar con 1 pago/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ nextChargeDate: toInputValue(expectedNext) })
      );
      expect(mockConfirmMatch).toHaveBeenCalledTimes(1);
      expect(mockConfirmMatch).toHaveBeenCalledWith('sub-new', 'DISNEY PLUS', 'tx-ok');
    });
  });

  it('permite guardar sin vincular pagos', async () => {
    const user = userEvent.setup();
    render(
      <CreateSubscriptionDialog open onOpenChange={vi.fn()} onCreated={vi.fn()} existingNames={[]} />
    );

    await user.type(screen.getByLabelText('Nombre'), 'Disney+');
    await user.type(screen.getByLabelText('Importe'), '8.99');
    await user.click(screen.getByRole('button', { name: /Siguiente: pagos anteriores/ }));

    await screen.findByText(/Hemos buscado movimientos parecidos/);
    await user.click(screen.getByRole('button', { name: /Guardar sin vincular pagos/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
      expect(mockConfirmMatch).not.toHaveBeenCalled();
    });
  });
});

describe('historial con vinculación', () => {
  it('muestra pagos vinculados, desvincula y vincula movimientos parecidos', async () => {
    const user = userEvent.setup();
    const linkedDate = new Date();
    linkedDate.setMonth(linkedDate.getMonth() - 1);
    const suggestionDate = new Date();
    suggestionDate.setDate(suggestionDate.getDate() - 3);

    mockTransactionSearch([
      { id: 'tx-suggestion', description: 'NETFLIX COM*AMS', amount: -11.99, date: suggestionDate.toISOString() },
      { id: 'tx-other-amount', description: 'NETFLIX INTL', amount: -12.99, date: suggestionDate.toISOString() },
      { id: 'tx-linked-elsewhere', description: 'NETFLIX OTRO', amount: -11.99, date: suggestionDate.toISOString(), subscriptionId: 'other' },
    ]);

    render(
      <SubscriptionHistoryDialog
        subscription={baseSubscription({
          recentTransactions: [
            { id: 'tx-linked', amount: -11.99, date: linkedDate.toISOString(), description: 'NETFLIX' },
          ],
          lastTransaction: { id: 'tx-linked', amount: -11.99, date: linkedDate.toISOString(), description: 'NETFLIX' },
        })}
        open
        onOpenChange={vi.fn()}
        onChanged={vi.fn()}
      />
    );

    expect(screen.getByText(/¿Falta algún pago\?/)).toBeInTheDocument();
    expect(screen.getByText('Movimientos sin vincular que se parecen')).toBeInTheDocument();
    const unlinkButtons = await screen.findAllByRole('button', { name: /Desvincular/i });
    expect(unlinkButtons).toHaveLength(1);
    await user.click(unlinkButtons[0]);
    expect(mockUnlinkTransaction).toHaveBeenCalledWith('sub-1', 'tx-linked');

    const checkboxes = await screen.findAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    await user.click(screen.getByRole('button', { name: /Vincular 1 pago/i }));

    await waitFor(() => {
      expect(mockConfirmMatch).toHaveBeenCalledWith('sub-1', 'NETFLIX COM*AMS', 'tx-suggestion');
    });
  });
});
