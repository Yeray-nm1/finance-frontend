import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import userEvent from '@testing-library/user-event';
import DashboardPage from '../page';
import { MONTH_NAMES } from '@/lib/budget-constants';

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

vi.mock('../components/MonthlyEvolutionCard', () => ({
  MonthlyEvolutionCard: () => <div>MonthlyEvolutionCard mock</div>,
}));

vi.mock('../components/BudgetOverviewCard', () => ({
  BudgetOverviewCard: () => <div>BudgetOverviewCard mock</div>,
}));

vi.mock('../components/RecurringCard', () => ({
  RecurringCard: () => <div>RecurringCard mock</div>,
}));

vi.mock('../components/RecentTransactionsCard', () => ({
  RecentTransactionsCard: () => <div>RecentTransactionsCard mock</div>,
}));

vi.mock('../components/OnboardingChecklist', () => ({
  OnboardingChecklist: () => <div>OnboardingChecklist mock</div>,
}));

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() { /* noop */ }
    unobserve() { /* noop */ }
    disconnect() { /* noop */ }
  };
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

function getMonthSelect() {
  return screen.getByRole('combobox', { name: /mes y año/i });
}

async function selectMonth(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(getMonthSelect());
  await user.click(screen.getByRole('option', { name: label }));
}

describe('DashboardPage month navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.history.replaceState(null, '', '/');
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
    const select = getMonthSelect();
    expect(select).toBeInTheDocument();
  });

  it('select reflects current month and year on load', async () => {
    const now = new Date();
    const expectedLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
    render(<DashboardPage />);
    await waitFor(() => expect(screen.queryByText('Cargando...')).not.toBeInTheDocument());
    expect(getMonthSelect()).toHaveTextContent(expectedLabel);
  });

  it('changing month reloads dashboard with new month/year', async () => {
    const user = userEvent.setup();
    mockMonths.mockResolvedValue([{ year: 2026, month: 3 }]);
    render(<DashboardPage />);
    await waitFor(() => expect(screen.queryByText('Cargando...')).not.toBeInTheDocument());
    mockGet.mockClear();
    await selectMonth(user, 'Marzo 2026');
    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    expect(mockGet.mock.calls[0][0]).toBe(2026);
    expect(mockGet.mock.calls[0][1]).toBe(3);
  });

  it('changing month passes AbortSignal', async () => {
    const user = userEvent.setup();
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
    await selectMonth(user, 'Marzo 2026');
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
    expect(screen.getByText('MonthlyEvolutionCard mock')).toBeInTheDocument();
    expect(screen.getByText('BudgetOverviewCard mock')).toBeInTheDocument();
    expect(screen.getByText('RecurringCard mock')).toBeInTheDocument();
    expect(screen.getByText('RecentTransactionsCard mock')).toBeInTheDocument();
  });

  it('shows only current month in dropdown when no available months returned', async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);
    await waitFor(() => expect(screen.queryByText('Cargando...')).not.toBeInTheDocument());
    await user.click(getMonthSelect());
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('shows Volver a día actual button when viewing a non-current month', async () => {
    const user = userEvent.setup();
    mockMonths.mockResolvedValue([{ year: 2026, month: 3 }]);
    render(<DashboardPage />);
    await waitFor(() => expect(screen.queryByText('Cargando...')).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Volver a día actual' })).not.toBeInTheDocument();

    await selectMonth(user, 'Marzo 2026');
    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Volver a día actual' })).toBeInTheDocument();
  });

  it('Volver a día actual button navigates back to current month', async () => {
    const user = userEvent.setup();
    const now = new Date();
    const currentLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
    mockMonths.mockResolvedValue([{ year: 2026, month: 3 }]);
    render(<DashboardPage />);
    await waitFor(() => expect(screen.queryByText('Cargando...')).not.toBeInTheDocument());

    await selectMonth(user, 'Marzo 2026');
    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    mockGet.mockClear();

    const volverButton = screen.getByRole('button', { name: 'Volver a día actual' });
    await user.click(volverButton);

    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    expect(getMonthSelect()).toHaveTextContent(currentLabel);
  });

  it('filters dropdown to only show available months from API', async () => {
    const user = userEvent.setup();
    mockMonths.mockResolvedValue([
      { year: 2025, month: 12 },
      { year: 2026, month: 3 },
    ]);
    render(<DashboardPage />);
    await waitFor(() => expect(screen.queryByText('Cargando...')).not.toBeInTheDocument());
    await user.click(getMonthSelect());
    const labels = screen.getAllByRole('option').map((option) => option.textContent);
    expect(labels).toContain('Diciembre 2025');
    expect(labels).toContain('Marzo 2026');
  });
});
