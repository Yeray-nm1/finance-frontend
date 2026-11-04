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
  budget: null as null | Record<string, unknown>,
  setBudget: vi.fn(),
  saveBudget: vi.fn(),
  deleteBudget: vi.fn(),
  calculateIncome: vi.fn(),
}));

vi.mock('@/hooks/useBudget', () => ({
  useBudget: vi.fn(() => ({
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
    onCancel,
    canSave,
    saving,
  }: {
    onCalculateIncome?: () => void;
    onTotalIncomeChange?: (value: number) => void;
    onSave?: () => void;
    onCancel?: () => void;
    canSave?: boolean;
    saving?: boolean;
  }) =>
    <div data-testid="budget-details">
      <button onClick={onCalculateIncome}>Calcular ingresos</button>
      <button onClick={() => onTotalIncomeChange?.(1000)}>Definir ingresos 1000</button>
      <button onClick={onSave} disabled={!canSave || saving}>Guardar presupuesto</button>
      <button onClick={onCancel}>Cancelar</button>
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
            <button aria-label={`Editar ${cat.name}`} onClick={() => onOpenEditCategory(cat)}>Editar</button>
            <button aria-label={`Eliminar ${cat.name}`} onClick={() => onDeleteCategory(cat)}>Eliminar</button>
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
  BudgetReadOnlyView: ({ categories }: { categories: { id: string; name: string }[] }) => (
    <div data-testid="budget-readonly">
      {categories.map((category) => (
        <span key={category.id}>{category.name}</span>
      ))}
    </div>
  ),
}));

vi.mock('@/app/budgets/components/IncomeReviewDialog', () => ({
  IncomeReviewDialog: () => <div data-testid="income-review-dialog" />,
}));

import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import BudgetsPage from '../page';

describe('BudgetsPage - optimistic category updates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    budgetHookMocks.budget = null;
    (api.categories.list as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'cat-1', name: 'Comida', type: 'needs', userId: '1' },
    ]);
    (api.budgets.list as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (api.budgets.monthly.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (api.budgets.months as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (api.categories.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'cat-2',
      name: 'Cine',
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

    await user.type(screen.getByLabelText('Nombre'), 'Cine');
    await user.click(screen.getByRole('button', { name: 'Crear categoría' }));

    await waitFor(() => {
      expect(screen.getByText('Cine')).toBeInTheDocument();
    });
    expect(api.categories.list).toHaveBeenCalledTimes(initialCalls);
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Categoría creada' })
    );
  });

  it('C06: edits category name without refetching list', async () => {
    const user = userEvent.setup();
    render(<BudgetsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
    });
    const initialCalls = (api.categories.list as ReturnType<typeof vi.fn>).mock.calls.length;

    await user.click(screen.getByRole('button', { name: 'Crear presupuesto' }));

    const editButton = screen.getByRole('button', { name: 'Editar Comida' });
    await user.click(editButton);

    const input = screen.getByDisplayValue('Comida');
    await user.clear(input);
    await user.type(input, 'Supermercado');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(screen.getByText('Supermercado')).toBeInTheDocument();
    });
    expect(api.categories.list).toHaveBeenCalledTimes(initialCalls);
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Categoría actualizada' })
    );
  });

  it('C07: deletes category without refetching list', async () => {
    const user = userEvent.setup();
    render(<BudgetsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
    });
    const initialCalls = (api.categories.list as ReturnType<typeof vi.fn>).mock.calls.length;

    await user.click(screen.getByRole('button', { name: 'Crear presupuesto' }));

    const deleteButton = screen.getByRole('button', { name: 'Eliminar Comida' });
    await user.click(deleteButton);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();

    const user2 = userEvent.setup({ pointerEventsCheck: 0 });
    await user2.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => {
      expect(screen.queryByText('Comida')).not.toBeInTheDocument();
    });
    expect(api.categories.list).toHaveBeenCalledTimes(initialCalls);
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Categoría eliminada' })
    );
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
      expect(screen.queryByRole('button', { name: /^Editar/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Crear presupuesto' })).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('C15: cancelar tras eliminar una categoría no la resucita en el resumen', async () => {
    let serverCategories = [
      { id: 'cat-1', name: 'Comida', type: 'needs', userId: '1' },
    ];
    (api.categories.list as ReturnType<typeof vi.fn>).mockImplementation(
      async () => serverCategories
    );
    (api.categories.delete as ReturnType<typeof vi.fn>).mockImplementation(
      async () => {
        serverCategories = [];
      }
    );

    const user = userEvent.setup();
    render(<BudgetsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Crear presupuesto' }));
    await user.click(screen.getByRole('button', { name: 'Eliminar Comida' }));

    const dialog = await screen.findByRole('dialog');
    const user2 = userEvent.setup({ pointerEventsCheck: 0 });
    await user2.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => {
      expect(screen.queryByText('Comida')).not.toBeInTheDocument();
    });

    const callsBeforeCancel = (api.categories.list as ReturnType<typeof vi.fn>).mock.calls.length;
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => {
      expect(screen.getByTestId('budget-readonly')).toBeInTheDocument();
      expect((api.categories.list as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(
        callsBeforeCancel
      );
    });
    expect(screen.queryByText('Comida')).not.toBeInTheDocument();
  });

  it('C16: cancelar tras añadir una categoría mantiene la categoría nueva', async () => {
    let serverCategories = [
      { id: 'cat-1', name: 'Comida', type: 'needs', userId: '1' },
    ];
    (api.categories.list as ReturnType<typeof vi.fn>).mockImplementation(
      async () => serverCategories
    );
    (api.categories.create as ReturnType<typeof vi.fn>).mockImplementation(
      async ({ name, type }: { name: string; type: string }) => {
        const created = { id: 'cat-2', name, type, userId: '1' };
        serverCategories = [...serverCategories, created];
        return created;
      }
    );

    const user = userEvent.setup();
    render(<BudgetsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Crear presupuesto' }));
    await user.click(screen.getByRole('button', { name: 'Añadir categoría' }));
    await user.type(screen.getByLabelText('Nombre'), 'Cine');
    await user.click(screen.getByRole('button', { name: 'Crear categoría' }));

    await waitFor(() => {
      expect(screen.getByText('Cine')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => {
      expect(screen.getByTestId('budget-readonly')).toBeInTheDocument();
    });
    expect(screen.getByText('Cine')).toBeInTheDocument();
  });

  it('C17: un mes pasado solo muestra las categorías guardadas en su presupuesto', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 15));
    const monthly = {
      id: 'budget-1',
      userId: '1',
      month: 5,
      year: 2026,
      totalIncome: 2500,
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z',
      typeAllocations: [
        { type: 'needs', percentage: 50 },
        { type: 'leisure', percentage: 20 },
        { type: 'savings', percentage: 20 },
        { type: 'other', percentage: 10 },
      ],
      categoryAllocations: [{ categoryId: 'cat-1', amount: 1250 }],
    };
    budgetHookMocks.budget = monthly;
    (api.categories.list as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'cat-1', name: 'Comida', type: 'needs', userId: '1' },
      { id: 'cat-2', name: 'Categoría nueva', type: 'needs', userId: '1' },
    ]);
    (api.budgets.months as ReturnType<typeof vi.fn>).mockResolvedValue([
      { year: 2026, month: 5 },
    ]);
    (api.budgets.monthly.get as ReturnType<typeof vi.fn>).mockImplementation(
      async (month: number, year: number) =>
        month === 5 && year === 2026 ? monthly : null
    );

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

      const view = screen.getByTestId('budget-readonly');
      expect(within(view).getByText('Comida')).toBeInTheDocument();
      expect(within(view).queryByText('Categoría nueva')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
