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

describe('BudgetDetails readOnly mode', () => {
  it('disables income input when readOnly is true', () => {
    renderDefault({ readOnly: true, totalIncome: 3000 });
    const input = screen.getByRole('spinbutton');
    expect(input).toBeDisabled();
  });

  it('hides calculate income button when readOnly is true', () => {
    renderDefault({ readOnly: true, onCalculateIncome: vi.fn() });
    expect(screen.queryByRole('button', { name: /calcular ingresos/i })).not.toBeInTheDocument();
  });

  it('hides save button when readOnly is true', () => {
    renderDefault({ readOnly: true, onSave: vi.fn(), canSave: true });
    expect(screen.queryByRole('button', { name: /guardar presupuesto/i })).not.toBeInTheDocument();
  });

  it('hides cancel button when readOnly is true even if onCancel is provided', () => {
    renderDefault({ readOnly: true, onCancel: vi.fn() });
    expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument();
  });

  it('shows cancel button when readOnly is false and onCancel is provided', () => {
    renderDefault({ readOnly: false, onCancel: vi.fn(), onSave: vi.fn(), totalIncome: 3000, canSave: true });
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('renders type cards even when readOnly is true', () => {
    renderDefault({ readOnly: true });
    expect(screen.getByText('Necesidades')).toBeInTheDocument();
    expect(screen.getByText('Ocio')).toBeInTheDocument();
    expect(screen.getByText('Ahorro')).toBeInTheDocument();
  });

  it('shows distribution indicator when readOnly is true', () => {
    renderDefault({ readOnly: true });
    expect(screen.getByText(/distribución correcta/i)).toBeInTheDocument();
  });
});
