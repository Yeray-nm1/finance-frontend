import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BudgetsCard } from '../BudgetsCard';

vi.mock('../BudgetTypeSection', () => ({
  BudgetTypeSection: ({ type, budgets, isExpanded, onToggle }: { type: string; budgets: unknown[]; isExpanded: boolean; onToggle: () => void }) => (
    <div data-testid={`type-section-${type}`}>
      <button onClick={onToggle}>{type}</button>
      {isExpanded && <div data-testid={`expanded-${type}`} />}
      <span>{budgets.length} budgets</span>
    </div>
  ),
}));

describe('BudgetsCard', () => {
  const sampleBudgets = [
    { category: 'Alquiler', categoryType: 'needs' as const, percentage: 30, spent: 800, budgeted: 1500, progress: 53.3, status: 'ok' as const },
    { category: 'Comida', categoryType: 'needs' as const, percentage: 20, spent: 900, budgeted: 1000, progress: 90, status: 'warning' as const },
    { category: 'Cine', categoryType: 'leisure' as const, percentage: 10, spent: 600, budgeted: 500, progress: 120, status: 'over' as const },
  ];

  it('renders a card titled Presupuestos', () => {
    render(<BudgetsCard budgets={sampleBudgets} />);
    expect(screen.getByText('Presupuestos')).toBeInTheDocument();
  });

  it('groups budgets by type', () => {
    render(<BudgetsCard budgets={sampleBudgets} />);
    expect(screen.getByTestId('type-section-needs')).toBeInTheDocument();
    expect(screen.getByTestId('type-section-leisure')).toBeInTheDocument();
  });

  it('shows budget count per type', () => {
    render(<BudgetsCard budgets={sampleBudgets} />);
    expect(screen.getByText('2 budgets')).toBeInTheDocument();
    expect(screen.getByText('1 budgets')).toBeInTheDocument();
  });

  it('renders a link to manage budgets', () => {
    render(<BudgetsCard budgets={sampleBudgets} />);
    const link = screen.getByRole('link', { name: 'Gestionar presupuesto' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/budgets');
  });
});
