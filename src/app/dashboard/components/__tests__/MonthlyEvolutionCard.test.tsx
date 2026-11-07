import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';

const mockBarChart = vi.fn();

vi.mock('recharts', () => ({
  BarChart: (props: Record<string, unknown>) => {
    mockBarChart(props);
    return <div data-testid="bar-chart">{props.children as ReactNode}</div>;
  },
  Bar: (props: Record<string, unknown>) => (
    <div data-testid={`bar-${String(props.dataKey)}`} />
  ),
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: (props: Record<string, unknown>) => (
    <div>{props.children as ReactNode}</div>
  ),
}));

import { MonthlyEvolutionCard } from '../MonthlyEvolutionCard';
import type { MonthlyEvolutionItem } from '@/types/dashboard';

const data: MonthlyEvolutionItem[] = [
  { year: 2026, month: 4, income: 2500, expenses: 90 },
  { year: 2026, month: 5, income: 2500, expenses: 127 },
];

describe('MonthlyEvolutionCard', () => {
  it('renders a card titled Evolución mensual', () => {
    render(<MonthlyEvolutionCard data={data} />);
    expect(screen.getByRole('heading', { name: 'Evolución mensual' })).toBeInTheDocument();
  });

  it('passes the last months with short labels to the chart', () => {
    mockBarChart.mockClear();
    render(<MonthlyEvolutionCard data={data} />);

    const chartData = mockBarChart.mock.calls[0][0].data as Array<Record<string, unknown>>;
    expect(chartData).toHaveLength(2);
    expect(chartData[0].label).toBe('Abr 26');
    expect(chartData[1].label).toBe('May 26');
  });

  it('renders income and expense bars', () => {
    render(<MonthlyEvolutionCard data={data} />);
    expect(screen.getByTestId('bar-income')).toBeInTheDocument();
    expect(screen.getByTestId('bar-expenses')).toBeInTheDocument();
  });

  it('shows a legend for income and expenses', () => {
    render(<MonthlyEvolutionCard data={data} />);
    expect(screen.getByText('Ingresos')).toBeInTheDocument();
    expect(screen.getByText('Gastos')).toBeInTheDocument();
  });

  it('shows an empty state when all months are empty', () => {
    render(
      <MonthlyEvolutionCard
        data={[
          { year: 2026, month: 4, income: 0, expenses: 0 },
          { year: 2026, month: 5, income: 0, expenses: 0 },
        ]}
      />
    );
    expect(screen.getByText('Sin datos en los últimos 6 meses')).toBeInTheDocument();
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
  });
});
