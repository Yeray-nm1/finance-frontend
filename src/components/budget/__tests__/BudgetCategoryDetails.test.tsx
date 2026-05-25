import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BudgetCategoryDetails } from '../BudgetCategoryDetails';

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const categories = [
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

describe('BudgetCategoryDetails readOnly mode', () => {
  it('does not render slider when readOnly is true', () => {
    renderDefault({ readOnly: true });
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  });

  it('hides add category button when readOnly is true', () => {
    renderDefault({ readOnly: true });
    expect(screen.queryByRole('button', { name: /añadir categoría/i })).not.toBeInTheDocument();
  });

  it('shows category names when readOnly is true', () => {
    renderDefault({ readOnly: true });
    expect(screen.getByText('Comida')).toBeInTheDocument();
  });

  it('shows percentage and amount when readOnly is true', () => {
    renderDefault({ readOnly: true });
    expect(screen.getByText(/50%/)).toBeInTheDocument();
  });

  it('shows category names as plain text without bordered containers in readOnly', () => {
    const { container } = renderDefault({ readOnly: true });
    const categoryDivs = container.querySelectorAll('.border-border');
    const categoryNames = Array.from(categoryDivs).filter(
      (el) => el.textContent?.includes('Comida')
    );
    expect(categoryNames.length).toBe(0);
  });
});

describe('BudgetCategoryDetails default (editable) mode', () => {
  it('renders slider when readOnly is false or undefined', () => {
    renderDefault({});
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).not.toHaveAttribute('data-disabled');
  });

  it('renders add category button when readOnly is false', () => {
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
    const emptyCategories: { id: string; name: string; type: string; userId: string }[] = [];
    renderDefault({ categories: emptyCategories, selectedType: 'needs' });
    expect(screen.getByText('Sin categorías en este tipo de gasto')).toBeInTheDocument();
  });

  it('hides placeholder message when categories exist', () => {
    renderDefault({ selectedType: 'needs' });
    expect(screen.queryByText('Sin categorías en este tipo de gasto')).not.toBeInTheDocument();
  });

  it('shows placeholder in both readOnly and edit modes', () => {
    const emptyCategories: { id: string; name: string; type: string; userId: string }[] = [];
    const { rerender } = render(
      <BudgetCategoryDetails
        categories={emptyCategories}
        selectedType="needs"
        typeAllocations={typeAllocations}
        onPercentageChange={vi.fn()}
        totalIncome={3000}
        saveError={null}
        onOpenEditCategory={vi.fn()}
        onDeleteCategory={vi.fn()}
        onAddCategory={vi.fn()}
        readOnly={true}
      />
    );
    expect(screen.getByText('Sin categorías en este tipo de gasto')).toBeInTheDocument();

    rerender(
      <BudgetCategoryDetails
        categories={emptyCategories}
        selectedType="needs"
        typeAllocations={typeAllocations}
        onPercentageChange={vi.fn()}
        totalIncome={3000}
        saveError={null}
        onOpenEditCategory={vi.fn()}
        onDeleteCategory={vi.fn()}
        onAddCategory={vi.fn()}
        readOnly={false}
      />
    );
    expect(screen.getByText('Sin categorías en este tipo de gasto')).toBeInTheDocument();
  });

  it('shows add category button in edit mode even when no categories', () => {
    const emptyCategories: { id: string; name: string; type: string; userId: string }[] = [];
    renderDefault({ categories: emptyCategories, selectedType: 'needs', readOnly: false });
    expect(screen.getByRole('button', { name: /añadir categoría/i })).toBeInTheDocument();
  });
});
