import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';

const mockPie = vi.fn();
const mockPieChart = vi.fn();
const mockTooltip = vi.fn();
const mockResponsiveContainer = vi.fn();

vi.mock('recharts', () => ({
  Pie: (props: Record<string, unknown>) => {
    mockPie(props);
    return <div data-testid="pie">{JSON.stringify(props.data)}</div>;
  },
  PieChart: (props: Record<string, unknown>) => {
    mockPieChart(props);
    return <div data-testid="pie-chart">{props.children as ReactNode}</div>;
  },
  Tooltip: (props: Record<string, unknown>) => {
    mockTooltip(props);
    return null;
  },
  ResponsiveContainer: (props: Record<string, unknown>) => {
    mockResponsiveContainer(props);
    return <div>{props.children as ReactNode}</div>;
  },
}));

vi.mock('@/lib/format', () => ({
  formatCurrency: (n: number) => {
    const formatted = Math.abs(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${formatted} €`;
  },
}));

import { BalanceDonut } from '../BalanceDonut';

describe('BalanceDonut', () => {
  const defaultProps = {
    income: 5000,
    expenses: 3000,
    savings: 1000,
    available: 1000,
    balance: 2000,
  };

  it('W2-AC1: renders PieChart with 3 slices when income > 0', () => {
    render(<BalanceDonut {...defaultProps} />);
    const pie = screen.getByTestId('pie');
    expect(pie).toBeInTheDocument();
    const data = JSON.parse(pie.textContent || '[]');
    expect(data).toHaveLength(3);
    const names = data.map((d: { name: string }) => d.name);
    expect(names).toContain('Gastos');
    expect(names).toContain('Ahorro');
    expect(names).toContain('Disponible');
  });

  it('W2-AC2: slice values correspond to props', () => {
    render(<BalanceDonut {...defaultProps} />);
    const pie = screen.getByTestId('pie');
    const data = JSON.parse(pie.textContent || '[]');
    const gastos = data.find((d: { name: string }) => d.name === 'Gastos');
    const ahorro = data.find((d: { name: string }) => d.name === 'Ahorro');
    const disponible = data.find((d: { name: string }) => d.name === 'Disponible');
    expect(gastos.value).toBe(3000);
    expect(ahorro.value).toBe(1000);
    expect(disponible.value).toBe(1000);
  });

  it('W2-AC3: center shows balance formatted with sign', () => {
    render(<BalanceDonut {...defaultProps} />);
    expect(screen.getByText(/\+2000/)).toBeInTheDocument();
    expect(screen.getByText('Balance')).toBeInTheDocument();
  });

  it('W2-AC5: when income is 0, shows message instead of donut', () => {
    render(<BalanceDonut income={0} expenses={0} savings={0} available={0} balance={0} />);
    expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument();
    expect(screen.getByText('Sin datos de ingresos este mes')).toBeInTheDocument();
  });

  it('W2-AC6: when balance is negative, center shows balance in red', () => {
    render(<BalanceDonut income={3000} expenses={4000} savings={0} available={0} balance={-1000} />);
    const balanceEl = screen.getByText(/-1000/);
    expect(balanceEl.className).toContain('text-expense');
  });
});
