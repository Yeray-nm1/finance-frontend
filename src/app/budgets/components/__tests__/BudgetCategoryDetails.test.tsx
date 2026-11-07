import type { Category } from "@/types/categories";
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
      onPercentageChange={vi.fn()}
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
  it('renders slider', () => {
    renderDefault({});
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).not.toHaveAttribute('data-disabled');
  });

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
    expect(screen.getByText('100.0% del tipo')).toBeInTheDocument();
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
