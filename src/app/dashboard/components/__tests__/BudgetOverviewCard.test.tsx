import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BudgetOverviewCard } from '../BudgetOverviewCard';
import type { BudgetItem, CategorySpendingItem } from '@/types/dashboard';

const budgets: BudgetItem[] = [
  {
    categoryId: 'cat-food',
    category: 'Comida',
    categoryType: 'needs',
    percentage: 40,
    spent: 100,
    budgeted: 200,
    progress: 50,
    status: 'ok',
  },
];

const spending: CategorySpendingItem[] = [
  { categoryId: 'cat-food', category: 'Comida', categoryType: 'needs', amount: 100, percentage: 66.67 },
  { categoryId: 'cat-fun', category: 'Cine', categoryType: 'leisure', amount: 50, percentage: 33.33 },
  { categoryId: null, category: 'Sin categoría', categoryType: null, amount: 25, percentage: 16.67 },
];

function expand(label: string) {
  fireEvent.click(screen.getByRole('button', { name: `Expandir ${label}` }));
}

describe('BudgetOverviewCard', () => {
  it('renders a card titled Presupuesto with a link to manage budgets', () => {
    render(<BudgetOverviewCard budgets={budgets} spending={spending} monthValue="2026-05" />);
    expect(screen.getByRole('heading', { name: 'Presupuesto' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Gestionar presupuesto' })).toHaveAttribute(
      'href',
      '/budgets'
    );
  });

  it('starts with every type collapsed', () => {
    render(<BudgetOverviewCard budgets={budgets} spending={spending} monthValue="2026-05" />);
    expect(screen.queryByRole('link', { name: 'Ver transacciones de Comida' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expandir Necesidades' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('groups spending and budgets by type, including uncategorized spending', () => {
    render(<BudgetOverviewCard budgets={budgets} spending={spending} monthValue="2026-05" />);
    expect(screen.getByText('Necesidades')).toBeInTheDocument();
    expect(screen.getByText('Ocio')).toBeInTheDocument();
    expect(screen.getAllByText('Sin categoría').length).toBeGreaterThan(0);
  });

  it('shows spent and budgeted amounts for budgeted categories', () => {
    render(<BudgetOverviewCard budgets={budgets} spending={spending} monthValue="2026-05" />);
    expand('Necesidades');
    expect(screen.getByText(/100,00.*200,00/)).toBeInTheDocument();
  });

  it('shows the type budget in the header when it has no categories', () => {
    render(
      <BudgetOverviewCard
        budgets={[
          {
            categoryId: null,
            category: 'Otros',
            categoryType: 'other',
            percentage: 15,
            spent: 0,
            budgeted: 250,
            progress: 0,
            status: 'ok',
          },
        ]}
        spending={[]}
        monthValue="2026-05"
      />
    );
    expect(screen.getByText(/0,00.*250,00/)).toBeInTheDocument();
  });

  it('links budgeted categories to transactions filtered by category and month', () => {
    render(<BudgetOverviewCard budgets={budgets} spending={spending} monthValue="2026-05" />);
    expand('Necesidades');
    expect(screen.getByRole('link', { name: 'Ver transacciones de Comida' })).toHaveAttribute(
      'href',
      '/transactions?category=Comida&month=2026-05'
    );
  });

  it('includes categories without a budget', () => {
    render(<BudgetOverviewCard budgets={budgets} spending={spending} monthValue="2026-05" />);
    expand('Ocio');
    expect(screen.getByRole('link', { name: 'Ver transacciones de Cine' })).toHaveAttribute(
      'href',
      '/transactions?category=Cine&month=2026-05'
    );
  });

  it('links uncategorized spending with the uncategorized filter', () => {
    render(<BudgetOverviewCard budgets={budgets} spending={spending} monthValue="2026-05" />);
    expand('Sin categoría');
    expect(screen.getByRole('link', { name: 'Ver transacciones de Sin categoría' })).toHaveAttribute(
      'href',
      '/transactions?uncategorized=true&month=2026-05'
    );
  });

  it('expands and collapses a type', () => {
    render(<BudgetOverviewCard budgets={budgets} spending={spending} monthValue="2026-05" />);
    expand('Necesidades');
    expect(screen.getByRole('link', { name: 'Ver transacciones de Comida' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Contraer Necesidades' }));
    expect(screen.queryByRole('link', { name: 'Ver transacciones de Comida' })).not.toBeInTheDocument();
  });

  it('shows an empty state when there are no budgets or spending', () => {
    render(<BudgetOverviewCard budgets={[]} spending={[]} monthValue="2026-05" />);
    expect(screen.getByText('Sin presupuestos ni gastos este mes')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Definir presupuesto' })).toHaveAttribute(
      'href',
      '/budgets'
    );
  });

  it('shows spending and a define-budget link when there is no budget', () => {
    render(
      <BudgetOverviewCard
        budgets={[]}
        spending={[spending[1]]}
        monthValue="2026-05"
      />
    );
    expand('Ocio');
    expect(screen.getByRole('link', { name: 'Ver transacciones de Cine' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Definir presupuesto' })).toBeInTheDocument();
  });
});
