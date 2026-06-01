import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RecentTransactionsCard } from '../RecentTransactionsCard';

describe('RecentTransactionsCard', () => {
  const transactions = [
    { id: '1', date: '2026-05-27T10:00:00Z', amount: 2000, description: 'Salario', type: 'income' as const, category: 'Trabajo', account: 'Principal' },
    { id: '2', date: '2026-05-26T14:00:00Z', amount: 50, description: 'Cena', type: 'expense' as const, category: 'Comida', account: null },
    { id: '3', date: '2026-05-25T09:00:00Z', amount: 300, description: 'Transferencia ahorros', type: 'transfer' as const, category: null, account: 'Ahorros' },
  ];

  it('renders a card titled Transacciones recientes', () => {
    render(<RecentTransactionsCard transactions={transactions} />);
    expect(screen.getByText('Transacciones recientes')).toBeInTheDocument();
  });

  it('shows transaction descriptions', () => {
    render(<RecentTransactionsCard transactions={transactions} />);
    expect(screen.getByText('Salario')).toBeInTheDocument();
    expect(screen.getByText('Cena')).toBeInTheDocument();
  });

  it('shows Ver más link', () => {
    render(<RecentTransactionsCard transactions={transactions} />);
    const link = screen.getByText('Ver más');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')?.getAttribute('href')).toBe('/transactions');
  });

  it('has scrollable container', () => {
    const { container } = render(<RecentTransactionsCard transactions={transactions} />);
    const scrollable = container.querySelector('[class*="overflow-y-auto"]');
    expect(scrollable).toBeInTheDocument();
  });

  it('renders empty state when no transactions', () => {
    const { container } = render(<RecentTransactionsCard transactions={[]} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('shows category and account in secondary line', () => {
    render(<RecentTransactionsCard transactions={transactions} />);
    expect(screen.getByText('27 May · Trabajo · Principal')).toBeInTheDocument();
    expect(screen.getByText('26 May · Comida')).toBeInTheDocument();
    expect(screen.getByText('25 May · Ahorros')).toBeInTheDocument();
  });
});
