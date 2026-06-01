import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BudgetTypeSection } from '../BudgetTypeSection';

describe('BudgetTypeSection', () => {
  const sampleBudgets = [
    { category: 'Alquiler', categoryType: 'needs' as const, spent: 800, budgeted: 1500, progress: 53.3, status: 'ok' },
    { category: 'Comida', categoryType: 'needs' as const, spent: 900, budgeted: 1000, progress: 90, status: 'warning' },
  ];

  it('shows the type label', () => {
    render(
      <BudgetTypeSection
        type="needs"
        label="Necesidades"
        icon={<span>🏠</span>}
        budgets={sampleBudgets}
        isExpanded={false}
        onToggle={() => {}}
      />
    );
    expect(screen.getByText('Necesidades')).toBeInTheDocument();
  });

  it('shows progress bar with role="progressbar"', () => {
    render(
      <BudgetTypeSection
        type="needs"
        label="Necesidades"
        icon={<span>🏠</span>}
        budgets={sampleBudgets}
        isExpanded={false}
        onToggle={() => {}}
      />
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows individual budget items when expanded', () => {
    render(
      <BudgetTypeSection
        type="needs"
        label="Necesidades"
        icon={<span>🏠</span>}
        budgets={sampleBudgets}
        isExpanded={true}
        onToggle={() => {}}
      />
    );
    expect(screen.getByText('Alquiler')).toBeInTheDocument();
    expect(screen.getByText('Comida')).toBeInTheDocument();
  });

  it('hides individual items when collapsed', () => {
    render(
      <BudgetTypeSection
        type="needs"
        label="Necesidades"
        icon={<span>🏠</span>}
        budgets={sampleBudgets}
        isExpanded={false}
        onToggle={() => {}}
      />
    );
    expect(screen.queryByText('Alquiler')).not.toBeInTheDocument();
  });

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(
      <BudgetTypeSection
        type="needs"
        label="Necesidades"
        icon={<span>🏠</span>}
        budgets={sampleBudgets}
        isExpanded={false}
        onToggle={onToggle}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows status dot for each budget item', () => {
    render(
      <BudgetTypeSection
        type="needs"
        label="Necesidades"
        icon={<span>🏠</span>}
        budgets={sampleBudgets}
        isExpanded={true}
        onToggle={() => {}}
      />
    );
    const dots = document.querySelectorAll('.rounded-full');
    expect(dots.length).toBe(sampleBudgets.length);
  });

});
