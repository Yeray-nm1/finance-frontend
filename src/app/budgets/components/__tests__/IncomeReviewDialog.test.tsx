import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IncomeReviewDialog } from '../IncomeReviewDialog';
import type { IncomeGroup } from '@/types/budgets';

const mockGroups: IncomeGroup[] = [
  {
    label: 'NOMINA EMPRESA',
    count: 1,
    totalAmount: 2500,
    transactions: [
      { id: '1', date: '2026-04-01', amount: 2500, description: 'NOMINA EMPRESA' },
    ],
  },
  {
    label: 'BIZUM',
    count: 3,
    totalAmount: 150,
    transactions: [
      { id: '2', date: '2026-04-05', amount: 50, description: 'BIZUM DE 1234' },
      { id: '3', date: '2026-04-10', amount: 50, description: 'BIZUM DE 5678' },
      { id: '4', date: '2026-04-15', amount: 50, description: 'BIZUM DE 9012' },
    ],
  },
];

describe('IncomeReviewDialog', () => {
  it('shows all groups with checkboxes, labels, counts and amounts when open', () => {
    render(
      <IncomeReviewDialog
        open={true}
        onOpenChange={vi.fn()}
        groups={mockGroups}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText('NOMINA EMPRESA')).toBeInTheDocument();
    expect(screen.getByText('BIZUM')).toBeInTheDocument();

    expect(screen.getByText('1 transacción')).toBeInTheDocument();
    expect(screen.getByText('3 transacciones')).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    checkboxes.forEach((cb) => expect(cb).toBeChecked());
  });

  it('shows empty state when no groups provided', () => {
    render(
      <IncomeReviewDialog
        open={true}
        onOpenChange={vi.fn()}
        groups={[]}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText(/no se encontraron ingresos/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /aplicar/i })).not.toBeInTheDocument();
  });

  it('expands a group to see individual transactions', async () => {
    const user = userEvent.setup();

    render(
      <IncomeReviewDialog
        open={true}
        onOpenChange={vi.fn()}
        groups={mockGroups}
        onConfirm={vi.fn()}
      />
    );

    const expandButtons = screen.getAllByRole('button', { name: /expandir/i });
    await user.click(expandButtons[0]);
  });

  it('recalculates total when unchecking a group', async () => {
    const user = userEvent.setup();

    render(
      <IncomeReviewDialog
        open={true}
        onOpenChange={vi.fn()}
        groups={mockGroups}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText(/total seleccionado/i)).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    expect(screen.getByText(/total seleccionado: 150/i)).toBeInTheDocument();
  });

  it('calls onConfirm with selected total when clicking Aplicar', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <IncomeReviewDialog
        open={true}
        onOpenChange={vi.fn()}
        groups={[mockGroups[0]]}
        onConfirm={onConfirm}
      />
    );

    await user.click(screen.getByRole('button', { name: /aplicar/i }));
    expect(onConfirm).toHaveBeenCalledWith(2500);
  });

  it('calls onOpenChange with false when clicking Cancelar', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <IncomeReviewDialog
        open={true}
        onOpenChange={onOpenChange}
        groups={mockGroups}
        onConfirm={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
