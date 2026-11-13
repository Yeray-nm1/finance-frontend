import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionsMobileList } from '../TransactionsMobileList';
import type { Account } from '@/types/accounts';
import type { Category } from '@/types/categories';
import type { Transaction } from '@/types/transactions';

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() { /* noop */ }
    unobserve() { /* noop */ }
    disconnect() { /* noop */ }
  };
});

const categories: Category[] = [
  { id: 'cat-1', userId: 'user-1', name: 'Comida', type: 'needs' },
];

const accounts: Account[] = [
  { id: 'acc-1', userId: 'user-1', name: 'Cuenta principal', type: 'checking', createdAt: new Date().toISOString() },
];

const transactions: Transaction[] = [
  {
    id: 'tx-1',
    userId: 'user-1',
    accountId: 'acc-1',
    transferAccountId: null,
    categoryId: 'cat-1',
    date: '2026-11-10T00:00:00.000Z',
    amount: 25.5,
    description: 'Cena de equipo',
    type: 'expense',
    isSubscription: false,
    createdAt: '2026-11-10T00:00:00.000Z',
  },
];

function buildProps(overrides: Record<string, unknown> = {}) {
  return {
    transactions,
    categories,
    accounts,
    loading: false,
    hasActiveFilters: false,
    selectedIds: new Set<string>(),
    sortBy: 'date',
    sortOrder: 'desc',
    onSort: vi.fn(),
    onOpenEdit: vi.fn(),
    onDeleteClick: vi.fn(),
    onToggleSelect: vi.fn(),
    onToggleSelectAll: vi.fn(),
    ...overrides,
  };
}

describe('TransactionsMobileList', () => {
  it('renders transaction details as a card', () => {
    render(<TransactionsMobileList {...buildProps()} />);

    expect(screen.getByText('Cena de equipo')).toBeInTheDocument();
    expect(screen.getByText('Comida')).toBeInTheDocument();
    expect(screen.getByText('Cuenta principal')).toBeInTheDocument();
    expect(screen.getByText(/25,50/)).toBeInTheDocument();
  });

  it('shows the empty message without transactions', () => {
    render(<TransactionsMobileList {...buildProps({ transactions: [] })} />);

    expect(
      screen.getByText('No hay transacciones. Anade tu primera transaccion.')
    ).toBeInTheDocument();
  });

  it('shows the filtered empty message when filters are active', () => {
    render(
      <TransactionsMobileList
        {...buildProps({ transactions: [], hasActiveFilters: true })}
      />
    );

    expect(screen.getByText('Sin resultados. Prueba con otros filtros.')).toBeInTheDocument();
  });

  it('calls selection, edit and delete handlers', async () => {
    const user = userEvent.setup();
    const props = buildProps();
    render(<TransactionsMobileList {...props} />);

    await user.click(screen.getByRole('checkbox', { name: /seleccionar cena de equipo/i }));
    await user.click(screen.getByRole('button', { name: /editar cena de equipo/i }));
    await user.click(screen.getByRole('button', { name: /eliminar cena de equipo/i }));

    expect(props.onToggleSelect).toHaveBeenCalledWith('tx-1');
    expect(props.onOpenEdit).toHaveBeenCalledWith(transactions[0]);
    expect(props.onDeleteClick).toHaveBeenCalledWith('tx-1');
  });

  it('sorts by the selected field and toggles the current order', async () => {
    const user = userEvent.setup();
    const props = buildProps();
    render(<TransactionsMobileList {...props} />);

    await user.selectOptions(screen.getByRole('combobox', { name: /ordenar/i }), 'amount');
    expect(props.onSort).toHaveBeenCalledWith('amount');

    await user.click(screen.getByRole('button', { name: /orden/i }));
    expect(props.onSort).toHaveBeenCalledWith('date');
  });

  it('renders skeleton cards while loading', () => {
    const { container } = render(
      <TransactionsMobileList {...buildProps({ loading: true })} />
    );

    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(4);
    expect(screen.queryByText('Cena de equipo')).not.toBeInTheDocument();
  });
});
