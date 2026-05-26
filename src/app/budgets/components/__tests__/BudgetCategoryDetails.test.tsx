import type { Category } from "@/types/categories";
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
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
      onPercentageChange={vi.fn()}
      totalIncome={3000}
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
