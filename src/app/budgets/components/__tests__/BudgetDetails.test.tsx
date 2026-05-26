import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BudgetDetails } from '../BudgetDetails';

const defaultAllocations = [
  { type: 'needs', percentage: 50 },
  { type: 'leisure', percentage: 30 },
  { type: 'savings', percentage: 20 },
];

function renderDefault(props: Partial<Parameters<typeof BudgetDetails>[0]> = {}) {
  return render(
    <BudgetDetails
      totalIncome={0}
      onTotalIncomeChange={vi.fn()}
      typeAllocations={defaultAllocations}
      selectedType="needs"
      onSelectType={vi.fn()}
      totalAllocated={100}
      isValidTotal={true}
      {...props}
    />
  );
}

describe('BudgetDetails calculate income button', () => {
  it('renders button with default text', () => {
    renderDefault({ onCalculateIncome: vi.fn() });
    expect(screen.getByRole('button', { name: /calcular ingresos a partir del mes anterior/i })).toBeInTheDocument();
  });

  it('renders Calculator icon inside button', () => {
    renderDefault({ onCalculateIncome: vi.fn() });
    const button = screen.getByRole('button', { name: /calcular ingresos/i });
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('shows "Calculando..." when calculatingIncome is true', () => {
    renderDefault({ onCalculateIncome: vi.fn(), calculatingIncome: true });
    expect(screen.getByRole('button', { name: /calculando/i })).toBeInTheDocument();
  });

  it('disables button when onCalculateIncome is undefined', () => {
    renderDefault({ onCalculateIncome: undefined });
    expect(screen.getByRole('button', { name: /calcular ingresos/i })).toBeDisabled();
  });

  it('disables button when calculatingIncome is true', () => {
    renderDefault({ onCalculateIncome: vi.fn(), calculatingIncome: true });
    expect(screen.getByRole('button', { name: /calculando/i })).toBeDisabled();
  });

  it('calls onCalculateIncome when button is clicked', async () => {
    const onCalculateIncome = vi.fn();
    const user = userEvent.setup();
    renderDefault({ onCalculateIncome });
    await user.click(screen.getByRole('button', { name: /calcular ingresos/i }));
    expect(onCalculateIncome).toHaveBeenCalledOnce();
  });
});

