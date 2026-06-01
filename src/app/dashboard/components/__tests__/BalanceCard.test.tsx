import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BalanceCard } from '../BalanceCard';

vi.mock('../BalanceDonut', () => ({
  BalanceDonut: (props: Record<string, unknown>) => (
    <div data-testid="balance-donut" data-props={JSON.stringify(props)} />
  ),
}));

describe('BalanceCard', () => {
  const defaultProps = {
    income: 5000,
    expenses: 3000,
    savings: 1000,
    available: 1000,
    balance: 2000,
  };

  it('renders a card titled Balance', () => {
    render(<BalanceCard {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Balance' })).toBeInTheDocument();
  });

  it('shows total balance with sign', () => {
    render(<BalanceCard {...defaultProps} />);
    expect(screen.getByText(/\+2000/)).toBeInTheDocument();
  });

  it('shows vsPreviousMonth footer when provided', () => {
    render(<BalanceCard {...defaultProps} vsPreviousMonth={{ percentage: 5.2, amountDiff: 98.86 }} />);
    expect(screen.getByText(/Diferencia respecto al mes anterior/)).toBeInTheDocument();
    expect(screen.getByText(/\+5\.2%/)).toBeInTheDocument();
    expect(screen.getByText(/\(\+98/)).toBeInTheDocument();
  });

  it('shows negative vsPreviousMonth in red', () => {
    render(<BalanceCard {...defaultProps} vsPreviousMonth={{ percentage: -3.1, amountDiff: -63.98 }} />);
    const badge = screen.getByText(/-3\.1%/);
    expect(badge.className).toContain('text-expense');
  });

  it('does not show footer when vsPreviousMonth is undefined', () => {
    render(<BalanceCard {...defaultProps} />);
    expect(screen.queryByText(/diferencia respecto al mes anterior/)).not.toBeInTheDocument();
  });

  it('renders BalanceDonut with correct props', () => {
    render(<BalanceCard {...defaultProps} />);
    const donut = screen.getByTestId('balance-donut');
    const props = JSON.parse(donut.dataset.props ?? '{}');
    expect(props.income).toBe(5000);
    expect(props.expenses).toBe(3000);
    expect(props.savings).toBe(1000);
    expect(props.available).toBe(1000);
    expect(props.balance).toBe(2000);
  });

  it('shows 4 stat rows on the right side', () => {
    render(<BalanceCard {...defaultProps} />);
    expect(screen.getByText('Ingresos')).toBeInTheDocument();
    expect(screen.getByText('Gastos')).toBeInTheDocument();
    expect(screen.getByText('Ahorro')).toBeInTheDocument();
    expect(screen.getByText('Disponible')).toBeInTheDocument();
  });
});
