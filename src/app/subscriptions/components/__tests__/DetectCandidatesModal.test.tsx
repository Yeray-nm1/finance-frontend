import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DetectCandidatesModal } from '../DetectCandidatesModal';
import type { SubscriptionCandidate } from '@/types/subscriptions';

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

vi.mock('@/lib/api', () => ({
  api: {
    subscriptions: {
      detect: vi.fn(),
      saveDetected: vi.fn(),
    },
  },
}));

import { api } from '@/lib/api';

const mockDetect = api.subscriptions.detect as ReturnType<typeof vi.fn>;
const mockSaveDetected = api.subscriptions.saveDetected as ReturnType<typeof vi.fn>;

function candidate(overrides: Partial<SubscriptionCandidate> = {}): SubscriptionCandidate {
  return {
    name: 'Repsol Gasolina',
    amount: 42,
    frequency: 'monthly',
    confidence: 0.5,
    exists: false,
    transactions: [
      { id: 'tx-1', date: '2026-10-01T00:00:00.000Z', description: 'REPSOL', amount: 42 },
      { id: 'tx-2', date: '2026-11-01T00:00:00.000Z', description: 'REPSOL', amount: 42 },
    ],
    ...overrides,
  };
}

const candidates: SubscriptionCandidate[] = [
  candidate(),
  candidate({
    name: 'Mercadona Compra',
    amount: 52.1,
    confidence: 0.82,
    transactions: [
      { id: 'tx-3', date: '2026-09-01T00:00:00.000Z', description: 'MERCADONA', amount: 52.1 },
      { id: 'tx-4', date: '2026-10-01T00:00:00.000Z', description: 'MERCADONA', amount: 52.1 },
      { id: 'tx-5', date: '2026-11-01T00:00:00.000Z', description: 'MERCADONA', amount: 52.1 },
      { id: 'tx-6', date: '2026-12-01T00:00:00.000Z', description: 'MERCADONA', amount: 52.1 },
    ],
  }),
  candidate({ name: 'Netflix', amount: 11.99, exists: true, confidence: 0.98 }),
];

function renderModal(onConfirm = vi.fn()) {
  return render(
    <DetectCandidatesModal open onOpenChange={vi.fn()} onConfirm={onConfirm} />
  );
}

describe('DetectCandidatesModal — nuevo diseño', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDetect.mockResolvedValue({ candidates });
    mockSaveDetected.mockResolvedValue({ created: 1 });
  });

  it('detecta automáticamente al abrir y muestra los contadores de nuevos y existentes', async () => {
    renderModal();

    await screen.findByText('Repsol Gasolina');

    expect(mockDetect).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: 'Detectar suscripciones' })).toBeInTheDocument();
    expect(screen.getByText(/Hemos encontrado 2 pagos nuevos que se repiten/)).toBeInTheDocument();
    expect(screen.getByText(/Los 1 que ya tienes están ocultos/)).toBeInTheDocument();
  });

  it('muestra el badge sugerido y la advertencia de confianza baja', async () => {
    renderModal();

    await screen.findByText('Repsol Gasolina');

    expect(screen.getAllByText('Sugerido: pago recurrente')).toHaveLength(2);
    expect(screen.getByText('Pocos movimientos: confianza baja')).toBeInTheDocument();
    expect(screen.getByText('Parece un gasto variable (supermercado)')).toBeInTheDocument();
  });

  it('preselecciona solo el primer candidato y el botón refleja el conteo', async () => {
    renderModal();

    await screen.findByText('Repsol Gasolina');

    expect(screen.getByRole('checkbox', { name: 'Repsol Gasolina' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Mercadona Compra' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Guardar 1 seleccionada' })).toBeInTheDocument();
  });

  it('permite mostrar los candidatos que ya existen', async () => {
    const user = userEvent.setup();
    renderModal();

    await screen.findByText('Repsol Gasolina');
    expect(screen.queryByText('Netflix')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Mostrar las 1 que ya existen/ }));

    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('Ya existe')).toBeInTheDocument();
  });

  it('guarda solo los candidatos seleccionados', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderModal(onConfirm);

    await screen.findByText('Repsol Gasolina');
    await user.click(screen.getByRole('button', { name: 'Guardar 1 seleccionada' }));

    await waitFor(() => {
      expect(mockSaveDetected).toHaveBeenCalledTimes(1);
      expect(mockSaveDetected).toHaveBeenCalledWith([
        expect.objectContaining({ name: 'Repsol Gasolina', frequency: 'monthly' }),
      ]);
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  it('actualiza el botón al seleccionar otro candidato', async () => {
    const user = userEvent.setup();
    renderModal();

    await screen.findByText('Repsol Gasolina');
    await user.click(screen.getByRole('checkbox', { name: 'Mercadona Compra' }));

    expect(screen.getByRole('button', { name: 'Guardar 2 seleccionadas' })).toBeInTheDocument();
  });
});
