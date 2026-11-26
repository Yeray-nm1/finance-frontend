import type { Category } from "@/types/categories";
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BudgetCategoryDetails } from '../BudgetCategoryDetails';

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() { void 0; }
    unobserve() { void 0; }
    disconnect() { void 0; }
  };
});

const categories: Category[] = [
  { id: '1', name: 'Comida', type: 'needs', userId: '1' },
  { id: '2', name: 'Netflix', type: 'leisure', userId: '1' },
];

const typeAllocations = [
  { type: 'needs', percentage: 50 },
  { type: 'leisure', percentage: 20 },
  { type: 'savings', percentage: 15 },
  { type: 'other', percentage: 15 },
];

function renderDefault(props: Record<string, unknown> = {}) {
  return render(
    <BudgetCategoryDetails
      categories={categories}
      selectedType="needs"
      typeAllocations={typeAllocations}
      categoryAllocations={[
        { categoryId: '1', amount: 1500 },
        { categoryId: '2', amount: 600 },
      ]}
      onCategoryAmountChange={vi.fn()}
      totalIncome={3000}
      remaining={0}
      saveError={null}
      onOpenEditCategory={vi.fn()}
      onDeleteCategory={vi.fn()}
      onAddCategory={vi.fn()}
      {...props}
    />
  );
}


describe('BudgetCategoryDetails default mode', () => {
  it('renders add category button', () => {
    renderDefault({});
    expect(screen.getByRole('button', { name: /añadir categoría/i })).toBeInTheDocument();
  });

  it('shows category name in editable mode', () => {
    renderDefault({});
    expect(screen.getByText('Comida')).toBeInTheDocument();
  });

  it('renders categories in bordered containers in edit mode', () => {
    const { container } = renderDefault({});
    const borderedItems = container.querySelectorAll('.border-border');
    expect(borderedItems.length).toBeGreaterThanOrEqual(1);
  });

  it('shows the euro amount assigned to each category', () => {
    renderDefault({});
    expect(screen.getByLabelText('Importe de Comida')).toHaveValue(1500);
  });

  it('shows the percentage each category represents inside its type', () => {
    renderDefault({});
    expect(screen.getByText('100 % del tipo')).toBeInTheDocument();
  });

  it('notifies the amount change when editing a category amount', () => {
    const onCategoryAmountChange = vi.fn();
    renderDefault({ onCategoryAmountChange });

    const input = screen.getByLabelText('Importe de Comida');
    fireEvent.change(input, { target: { value: '900' } });

    expect(onCategoryAmountChange).toHaveBeenLastCalledWith('1', 900);
  });

  it('shows the remaining amount when the type is not fully distributed', () => {
    renderDefault({ remaining: 300 });
    expect(screen.getByText(/Te quedan 300,00/)).toBeInTheDocument();
  });

  it('shows how much the type is over-allocated', () => {
    renderDefault({ remaining: -150 });
    expect(screen.getByText(/Te has pasado en 150,00/)).toBeInTheDocument();
  });

  it('confirms when the type is fully distributed', () => {
    renderDefault({ remaining: 0 });
    expect(screen.getByText('✓ Reparto completo')).toBeInTheDocument();
  });
});

describe('BudgetCategoryDetails empty categories', () => {
  it('shows placeholder message when selected type has no categories', () => {
    const emptyCategories: Category[] = [];
    renderDefault({ categories: emptyCategories, selectedType: 'needs' });
    expect(screen.getByText('Sin categorías en este tipo de gasto')).toBeInTheDocument();
  });

  it('hides placeholder message when categories exist', () => {
    renderDefault({ selectedType: 'needs' });
    expect(screen.queryByText('Sin categorías en este tipo de gasto')).not.toBeInTheDocument();
  });

  it('shows placeholder message when selected type has no categories in default mode', () => {
    const emptyCategories: Category[] = [];
    renderDefault({ categories: emptyCategories, selectedType: 'needs' });
    expect(screen.getByText('Sin categorías en este tipo de gasto')).toBeInTheDocument();
  });

  it('shows add category button even when no categories', () => {
    const emptyCategories: Category[] = [];
    renderDefault({ categories: emptyCategories, selectedType: 'needs' });
    expect(screen.getByRole('button', { name: /añadir categoría/i })).toBeInTheDocument();
  });
});

describe('BudgetCategoryDetails — búsqueda y agrupado', () => {
  const manyCategories: Category[] = [
    { id: '1', name: 'Comida', type: 'needs', userId: '1' },
    { id: '2', name: 'Alquiler', type: 'needs', userId: '1' },
    { id: '3', name: 'Luz', type: 'needs', userId: '1' },
    { id: '4', name: 'Internet', type: 'needs', userId: '1' },
    { id: '5', name: 'Móvil', type: 'needs', userId: '1' },
    { id: '6', name: 'Agua', type: 'needs', userId: '1' },
    { id: '7', name: 'Seguro', type: 'needs', userId: '1' },
    { id: '8', name: 'Cine', type: 'needs', userId: '1' },
  ];

  const allocations = [
    { categoryId: '1', amount: 400 },
    { categoryId: '2', amount: 350 },
    { categoryId: '3', amount: 120 },
    { categoryId: '4', amount: 60 },
    { categoryId: '5', amount: 40 },
    { categoryId: '6', amount: 30 },
  ];

  function renderGrouped(props: Record<string, unknown> = {}) {
    return render(
      <BudgetCategoryDetails
        categories={manyCategories}
        selectedType="needs"
        typeAllocations={typeAllocations}
        categoryAllocations={allocations}
          onCategoryAmountChange={vi.fn()}
        totalIncome={2000}
        remaining={0}
        saveError={null}
        onOpenEditCategory={vi.fn()}
        onDeleteCategory={vi.fn()}
        onAddCategory={vi.fn()}
        {...props}
      />
    );
  }

  it('muestra la búsqueda y los chips con recuentos', () => {
    renderGrouped();

    expect(screen.getByRole('textbox', { name: 'Buscar categoría' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Con importe (6)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sin importe (2)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Todas (8)' })).toBeInTheDocument();
  });

  it('filtra las categorías por texto', async () => {
    const user = userEvent.setup();
    renderGrouped();

    await user.type(screen.getByRole('textbox', { name: 'Buscar categoría' }), 'alq');

    expect(screen.getByText('Alquiler')).toBeInTheDocument();
    expect(screen.queryByText('Comida')).not.toBeInTheDocument();
  });

  it('filtra por categorías sin importe', async () => {
    const user = userEvent.setup();
    renderGrouped();

    await user.click(screen.getByRole('button', { name: 'Sin importe (2)' }));

    expect(screen.getByText('Seguro')).toBeInTheDocument();
    expect(screen.getByText('Cine')).toBeInTheDocument();
    expect(screen.queryByText('Comida')).not.toBeInTheDocument();
  });

  it('lista las categorías con scroll', () => {
    const { container } = renderGrouped();

    const list = container.querySelector('[data-testid="budget-category-list"]');
    expect(list).toBeInTheDocument();
    expect(list?.className).toContain('overflow-y-auto');
    expect(list?.className).toContain('max-h-');
  });

  it('permite quitar una categoría del presupuesto', async () => {
    const user = userEvent.setup();
    const onCategoryAmountChange = vi.fn();
    renderGrouped({ onCategoryAmountChange });

    await user.click(screen.getByRole('button', { name: 'Quitar Comida del presupuesto' }));

    expect(onCategoryAmountChange).toHaveBeenCalledWith('1', 0);
  });

  it('muestra el enlace para ver más categorías con importe', () => {
    renderGrouped();

    expect(
      screen.getByRole('button', { name: /Ver 2 más con importe/ })
    ).toBeInTheDocument();
  });
});
