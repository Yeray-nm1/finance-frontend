import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() { void 0; }
    unobserve() { void 0; }
    disconnect() { void 0; }
  };
});

vi.mock('@/lib/api', () => ({
  api: {
    categories: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    budgets: {
      list: vi.fn(),
      monthly: { get: vi.fn() },
      calculateIncome: vi.fn(),
    },
  },
}));

vi.mock('@/hooks/useBudget', () => ({
  useBudget: vi.fn(() => ({
    budget: null,
    saving: false,
    setBudget: vi.fn(),
    saveBudget: vi.fn(),
    deleteBudget: vi.fn(),
    calculateIncome: vi.fn(),
  })),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/budgets',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/app/budgets/components/BudgetDetails', () => ({
  BudgetDetails: ({ onCalculateIncome }: { onCalculateIncome?: () => void }) =>
    <div data-testid="budget-details">
      <button onClick={onCalculateIncome}>Calcular ingresos</button>
    </div>,
}));

vi.mock('@/app/budgets/components/BudgetCategoryDetails', () => ({
  BudgetCategoryDetails: ({
    categories,
    onOpenEditCategory,
    onDeleteCategory,
    onAddCategory,
  }: {
    categories: { id: string; name: string; type: string }[];
    onOpenEditCategory: (cat: { id: string; name: string; type: string }) => void;
    onDeleteCategory: (cat: { id: string; name: string; type: string }) => void;
    onAddCategory: () => void;
  }) => (
    <div data-testid="budget-category-details">
      {categories.map((cat: { id: string; name: string; type: string }) => (
        <div key={cat.id} data-testid={`cat-${cat.id}`}>
          <span>{cat.name}</span>
          <button onClick={() => onOpenEditCategory(cat)}>Editar</button>
          <button onClick={() => onDeleteCategory(cat)}>Eliminar</button>
        </div>
      ))}
      <button onClick={onAddCategory}>Añadir categoría</button>
    </div>
  ),
}));

vi.mock('@/app/budgets/components/BudgetReadOnlyView', () => ({
  BudgetReadOnlyView: () => <div data-testid="budget-readonly" />,
}));

vi.mock('@/app/budgets/components/IncomeReviewDialog', () => ({
  IncomeReviewDialog: () => <div data-testid="income-review-dialog" />,
}));

import { api } from '@/lib/api';
import BudgetsPage from '../page';

describe('BudgetsPage - optimistic category updates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.categories.list as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'cat-1', name: 'Comida', type: 'needs', userId: '1' },
    ]);
    (api.budgets.list as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (api.budgets.monthly.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (api.categories.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'cat-2',
      name: 'Nueva categoría',
      type: 'needs',
      userId: '1',
    });
    (api.categories.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'cat-1',
      name: 'Supermercado',
      type: 'needs',
      userId: '1',
    });
    (api.categories.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it('C05: creates category without refetching list', async () => {
    const user = userEvent.setup();
    render(<BudgetsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
    });
    const initialCalls = (api.categories.list as ReturnType<typeof vi.fn>).mock.calls.length;

    await user.click(screen.getByRole('button', { name: 'Crear presupuesto' }));

    const addButton = screen.getByRole('button', { name: 'Añadir categoría' });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Nueva categoría')).toBeInTheDocument();
    });
    expect(api.categories.list).toHaveBeenCalledTimes(initialCalls);
  });

  it('C06: edits category name without refetching list', async () => {
    const user = userEvent.setup();
    render(<BudgetsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
    });
    const initialCalls = (api.categories.list as ReturnType<typeof vi.fn>).mock.calls.length;

    await user.click(screen.getByRole('button', { name: 'Crear presupuesto' }));

    const editButton = screen.getByRole('button', { name: 'Editar' });
    await user.click(editButton);

    const input = screen.getByDisplayValue('Comida');
    await user.clear(input);
    await user.type(input, 'Supermercado');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(screen.getByText('Supermercado')).toBeInTheDocument();
    });
    expect(api.categories.list).toHaveBeenCalledTimes(initialCalls);
  });

  it('C07: deletes category without refetching list', async () => {
    const user = userEvent.setup();
    render(<BudgetsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
    });
    const initialCalls = (api.categories.list as ReturnType<typeof vi.fn>).mock.calls.length;

    await user.click(screen.getByRole('button', { name: 'Crear presupuesto' }));

    const deleteButton = screen.getByRole('button', { name: 'Eliminar' });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
    });
    const user2 = userEvent.setup({ pointerEventsCheck: 0 });
    await user2.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => {
      expect(screen.queryByText('Comida')).not.toBeInTheDocument();
    });
    expect(api.categories.list).toHaveBeenCalledTimes(initialCalls);
  });
});
