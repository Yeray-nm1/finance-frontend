import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
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
      months: vi.fn(),
      monthly: { get: vi.fn() },
      calculateIncome: vi.fn(),
    },
  },
}));

const budgetHookMocks = vi.hoisted(() => ({
  setBudget: vi.fn(),
  saveBudget: vi.fn(),
  deleteBudget: vi.fn(),
  calculateIncome: vi.fn(),
}));

vi.mock('@/hooks/useBudget', () => ({
  useBudget: vi.fn(() => ({
    budget: null,
    saving: false,
    ...budgetHookMocks,
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
  BudgetDetails: ({
    onCalculateIncome,
    onTotalIncomeChange,
    onSave,
    canSave,
    saving,
  }: {
    onCalculateIncome?: () => void;
    onTotalIncomeChange?: (value: number) => void;
    onSave?: () => void;
    canSave?: boolean;
    saving?: boolean;
  }) =>
    <div data-testid="budget-details">
      <button onClick={onCalculateIncome}>Calcular ingresos</button>
      <button onClick={() => onTotalIncomeChange?.(1000)}>Definir ingresos 1000</button>
      <button onClick={onSave} disabled={!canSave || saving}>Guardar presupuesto</button>
      <span data-testid="can-save">{String(canSave)}</span>
    </div>,
}));

vi.mock('@/app/budgets/components/BudgetCategoryDetails', () => ({
  BudgetCategoryDetails: ({
    categories,
    categoryAllocations,
    onOpenEditCategory,
    onDeleteCategory,
    onAddCategory,
    onCategoryAmountChange,
    remaining,
  }: {
    categories: { id: string; name: string; type: string }[];
    categoryAllocations: { categoryId: string; amount: number }[];
    onOpenEditCategory: (cat: { id: string; name: string; type: string }) => void;
    onDeleteCategory: (cat: { id: string; name: string; type: string }) => void;
    onAddCategory: () => void;
    onCategoryAmountChange: (categoryId: string, amount: number) => void;
    remaining: number;
  }) => (
    <div data-testid="budget-category-details">
      {categories.map((cat: { id: string; name: string; type: string }) => {
        const amount = categoryAllocations.find((a) => a.categoryId === cat.id)?.amount ?? 0;
        return (
          <div key={cat.id} data-testid={`cat-${cat.id}`}>
            <span>{cat.name}</span>
            <span data-testid={`amount-${cat.id}`}>{amount}</span>
            <button onClick={() => onOpenEditCategory(cat)}>Editar</button>
            <button onClick={() => onDeleteCategory(cat)}>Eliminar</button>
            <button onClick={() => onCategoryAmountChange(cat.id, 400)}>Asignar 400</button>
            <button onClick={() => onCategoryAmountChange(cat.id, 500)}>Asignar 500</button>
          </div>
        );
      })}
      <span data-testid="remaining">{remaining}</span>
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
    (api.budgets.months as ReturnType<typeof vi.fn>).mockResolvedValue([]);
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

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();

    const user2 = userEvent.setup({ pointerEventsCheck: 0 });
    await user2.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => {
      expect(screen.queryByText('Comida')).not.toBeInTheDocument();
    });
    expect(api.categories.list).toHaveBeenCalledTimes(initialCalls);
  });

  it('C08: prev arrow jumps to the previous month with a budget and disables when none is left', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 15));
    (api.budgets.months as ReturnType<typeof vi.fn>).mockResolvedValue([
      { year: 2026, month: 5 },
      { year: 2026, month: 11 },
    ]);
    try {
      const user = userEvent.setup();
      render(<BudgetsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
      });

      const prevButton = () => screen.getByRole('button', { name: 'Mes anterior con presupuesto' });

      expect(screen.getByRole('button', { name: 'Ir a Noviembre 2026' })).toHaveAttribute('aria-pressed', 'true');
      expect(prevButton()).toBeEnabled();

      await user.click(prevButton());
      await waitFor(() => {
        expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: 'Ir a Mayo 2026' })).toHaveAttribute('aria-pressed', 'true');
      expect(prevButton()).toBeDisabled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('C09: month chip jumps directly to a month with budget', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 15));
    (api.budgets.months as ReturnType<typeof vi.fn>).mockResolvedValue([
      { year: 2026, month: 5 },
    ]);
    try {
      const user = userEvent.setup();
      render(<BudgetsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Ir a Mayo 2026' }));

      await waitFor(() => {
        expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: 'Ir a Mayo 2026' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'Mes anterior con presupuesto' })).toBeDisabled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('C10: next arrow from a past month returns to the current month when there is no budget in between', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 15));
    (api.budgets.months as ReturnType<typeof vi.fn>).mockResolvedValue([
      { year: 2026, month: 5 },
    ]);
    try {
      const user = userEvent.setup();
      render(<BudgetsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Ir a Mayo 2026' }));
      await waitFor(() => {
        expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Mes siguiente' }));
      await waitFor(() => {
        expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: 'Ir a Noviembre 2026 (sin presupuesto)' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.queryByRole('button', { name: 'Ir a Junio 2026' })).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('C11: next arrow from a past month jumps to the next budget month before the current one', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 15));
    (api.budgets.months as ReturnType<typeof vi.fn>).mockResolvedValue([
      { year: 2026, month: 5 },
      { year: 2026, month: 9 },
    ]);
    try {
      const user = userEvent.setup();
      render(<BudgetsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Ir a Mayo 2026' }));
      await waitFor(() => {
        expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Mes siguiente' }));
      await waitFor(() => {
        expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: 'Ir a Septiembre 2026' })).toHaveAttribute('aria-pressed', 'true');
    } finally {
      vi.useRealTimers();
    }
  });

  it('C12: blocks saving while a type does not match its allocation', async () => {
    const user = userEvent.setup();
    render(<BudgetsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Crear presupuesto' }));
    await user.click(screen.getByRole('button', { name: 'Definir ingresos 1000' }));
    await user.click(screen.getByRole('button', { name: 'Asignar 400' }));

    await waitFor(() => {
      expect(screen.getByTestId('can-save')).toHaveTextContent('false');
    });
    expect(screen.getByRole('button', { name: 'Guardar presupuesto' })).toBeDisabled();
    expect(screen.getByTestId('remaining')).toHaveTextContent('100');
  });

  it('C13: saves category amounts in euros once every type matches', async () => {
    budgetHookMocks.saveBudget.mockResolvedValue({ id: 'budget-1' });
    const user = userEvent.setup();
    render(<BudgetsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Crear presupuesto' }));
    await user.click(screen.getByRole('button', { name: 'Definir ingresos 1000' }));
    await user.click(screen.getByRole('button', { name: 'Asignar 500' }));

    await waitFor(() => {
      expect(screen.getByTestId('can-save')).toHaveTextContent('true');
    });
    await user.click(screen.getByRole('button', { name: 'Guardar presupuesto' }));

    await waitFor(() => {
      expect(budgetHookMocks.saveBudget).toHaveBeenCalledWith(
        1000,
        expect.any(Array),
        [{ categoryId: 'cat-1', amount: 500 }]
      );
    });
  });

  it('C14: past budget months stay read-only and cannot be edited', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 15));
    (api.budgets.months as ReturnType<typeof vi.fn>).mockResolvedValue([
      { year: 2026, month: 5 },
    ]);
    try {
      const user = userEvent.setup();
      render(<BudgetsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Ir a Mayo 2026' }));
      await waitFor(() => {
        expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('budget-readonly')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Crear presupuesto' })).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
