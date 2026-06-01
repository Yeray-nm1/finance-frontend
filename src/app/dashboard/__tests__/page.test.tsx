import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPage from '../page';

const mockGet = vi.fn();
const mockMonths = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    dashboard: {
      get: (...args: unknown[]) => mockGet(...args),
      months: (...args: unknown[]) => mockMonths(...args),
    },
  },
}));

vi.mock('../components/BalanceCard', () => ({
  BalanceCard: () => <div>BalanceCard mock</div>,
}));

vi.mock('../components/BudgetsCard', () => ({
  BudgetsCard: () => <div>BudgetsCard mock</div>,
}));

vi.mock('../components/RecurringCard', () => ({
  RecurringCard: () => <div>RecurringCard mock</div>,
}));

vi.mock('../components/RecentTransactionsCard', () => ({
  RecentTransactionsCard: () => <div>RecentTransactionsCard mock</div>,
}));

describe('DashboardPage month navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMonths.mockResolvedValue([]);
    mockGet.mockResolvedValue({
      balance: { income: 5000, expenses: 3000, savings: 1000, available: 1000, balance: 2000 },
      budgets: [],
      recurring: { manual: [] },
      transactions: [],
    });
  });

  it('renders a single select for month and year in header', async () => {
    render(<DashboardPage />);
    await waitFor(() => expect(screen.queryByText('Cargando...')).not.toBeInTheDocument());
    const select = screen.getByRole('combobox', { name: /mes y año/i });
    expect(select).toBeInTheDocument();
  });

  it('select reflects current month and year on load', async () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    render(<DashboardPage />);
    await waitFor(() => expect(screen.queryByText('Cargando...')).not.toBeInTheDocument());
    const select = screen.getByRole('combobox', { name: /mes y año/i }) as HTMLSelectElement;
    expect(select.value).toBe(expected);
  });

  it('changing month reloads dashboard with new month/year', async () => {
    mockMonths.mockResolvedValue([{ year: 2026, month: 3 }]);
    render(<DashboardPage />);
    await waitFor(() => expect(screen.queryByText('Cargando...')).not.toBeInTheDocument());
    mockGet.mockClear();
    const select = screen.getByRole('combobox', { name: /mes y año/i });
    fireEvent.change(select, { target: { value: '2026-03' } });
    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    expect(mockGet.mock.calls[0][0]).toBe(2026);
    expect(mockGet.mock.calls[0][1]).toBe(3);
  });

  it('changing month passes AbortSignal', async () => {
    mockMonths.mockResolvedValue([{ year: 2026, month: 3 }]);
    let capturedSignal: AbortSignal | undefined;
    mockGet.mockImplementation((_year: number, _month: number, signal?: AbortSignal) => {
      capturedSignal = signal ?? undefined;
      return Promise.resolve({
        balance: { income: 5000, expenses: 3000, savings: 1000, available: 1000, balance: 2000 },
        budgets: [],
        recurring: { manual: [] },
        transactions: [],
      });
    });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.queryByText('Cargando...')).not.toBeInTheDocument());
    mockGet.mockClear();
    capturedSignal = undefined;
    const select = screen.getByRole('combobox', { name: /mes y año/i });
    fireEvent.change(select, { target: { value: '2026-03' } });
    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    expect(capturedSignal).toBeInstanceOf(AbortSignal);
    expect(capturedSignal!.aborted).toBe(false);
  });

  it('shows empty state when no balance data exists', async () => {
    mockGet.mockResolvedValue({
      balance: { income: 0, expenses: 0, savings: 0, available: 0, balance: 0 },
      budgets: [],
      recurring: { manual: [] },
      transactions: [],
    });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.queryByText('Cargando...')).not.toBeInTheDocument());
    expect(screen.getByText(/No hay datos disponibles/)).toBeInTheDocument();
    expect(screen.queryByText('BalanceCard mock')).not.toBeInTheDocument();
  });

  it('renders all cards when data exists', async () => {
    render(<DashboardPage />);
    await waitFor(() => expect(screen.queryByText('Cargando...')).not.toBeInTheDocument());
    expect(screen.getByText('BalanceCard mock')).toBeInTheDocument();
    expect(screen.getByText('BudgetsCard mock')).toBeInTheDocument();
    expect(screen.getByText('RecurringCard mock')).toBeInTheDocument();
    expect(screen.getByText('RecentTransactionsCard mock')).toBeInTheDocument();
  });

  it('shows only current month in dropdown when no available months returned', async () => {
    render(<DashboardPage />);
    await waitFor(() => expect(screen.queryByText('Cargando...')).not.toBeInTheDocument());
    const select = screen.getByRole('combobox', { name: /mes y año/i }) as HTMLSelectElement;
    expect(select.options.length).toBe(1);
  });

  it('shows Volver a día actual button when viewing a non-current month', async () => {
    mockMonths.mockResolvedValue([{ year: 2026, month: 3 }]);
    render(<DashboardPage />);
    await waitFor(() => expect(screen.queryByText('Cargando...')).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Volver a día actual' })).not.toBeInTheDocument();

    const select = screen.getByRole('combobox', { name: /mes y año/i });
    fireEvent.change(select, { target: { value: '2026-03' } });
    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Volver a día actual' })).toBeInTheDocument();
  });

  it('Volver a día actual button navigates back to current month', async () => {
    const now = new Date();
    const currentValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    mockMonths.mockResolvedValue([{ year: 2026, month: 3 }]);
    render(<DashboardPage />);
    await waitFor(() => expect(screen.queryByText('Cargando...')).not.toBeInTheDocument());

    const select = screen.getByRole('combobox', { name: /mes y año/i }) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '2026-03' } });
    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    mockGet.mockClear();

    const volverButton = screen.getByRole('button', { name: 'Volver a día actual' });
    fireEvent.click(volverButton);

    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    expect((screen.getByRole('combobox', { name: /mes y año/i }) as HTMLSelectElement).value).toBe(currentValue);
  });

  it('filters dropdown to only show available months from API', async () => {
    mockMonths.mockResolvedValue([
      { year: 2025, month: 12 },
      { year: 2026, month: 3 },
    ]);
    render(<DashboardPage />);
    await waitFor(() => expect(screen.queryByText('Cargando...')).not.toBeInTheDocument());
    const select = screen.getByRole('combobox', { name: /mes y año/i }) as HTMLSelectElement;
    const labels = Array.from(select.options).map((o) => o.label);
    expect(labels).toContain('Diciembre 2025');
    expect(labels).toContain('Marzo 2026');
  });
});
