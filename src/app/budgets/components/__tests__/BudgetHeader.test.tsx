import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BudgetHeader } from '../BudgetHeader';

const defaultProps = {
  monthOptions: [
    { value: '2026-01', label: 'Enero 2026', hasBudget: true, isCurrent: false },
    { value: '2026-02', label: 'Febrero 2026', hasBudget: false, isCurrent: false },
  ],
  selectedMonthValue: '2026-01',
  badge: { text: 'Editando', className: 'bg-warning/15 text-warning' },
  canGoBack: true,
  canGoForward: true,
  nextMonthLabel: 'Febrero 2026',
  showEditButton: true,
  editButtonLabel: 'Editar',
  onPrevMonth: vi.fn(),
  onNextMonth: vi.fn(),
  onMonthChange: vi.fn(),
  onStartEdit: vi.fn(),
};

describe('BudgetHeader', () => {
  it('B1: renders month chips, badge, nav arrows, and edit button', () => {
    render(<BudgetHeader {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Ir a Enero 2026' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Ir a Febrero 2026 (sin presupuesto)' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Editando')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
  });

  it('B2: prev arrow is disabled when canGoBack is false', () => {
    render(<BudgetHeader {...defaultProps} canGoBack={false} />);
    expect(screen.getByRole('button', { name: 'Mes anterior con presupuesto' })).toBeDisabled();
  });

  it('B3: next arrow is disabled when canGoForward is false', () => {
    render(<BudgetHeader {...defaultProps} canGoForward={false} />);
    expect(screen.getByRole('button', { name: 'Mes siguiente' })).toBeDisabled();
  });

  it('B4: edit button is visible when showEditButton is true', () => {
    render(<BudgetHeader {...defaultProps} showEditButton={true} />);
    expect(screen.getByRole('button', { name: 'Editar' })).toBeVisible();
  });

  it('B5: edit button is not rendered when showEditButton is false', () => {
    render(<BudgetHeader {...defaultProps} showEditButton={false} />);
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
  });

  it('B6: clicking prev arrow calls onPrevMonth', async () => {
    const user = userEvent.setup();
    const onPrevMonth = vi.fn();
    render(<BudgetHeader {...defaultProps} onPrevMonth={onPrevMonth} />);
    await user.click(screen.getByRole('button', { name: 'Mes anterior con presupuesto' }));
    expect(onPrevMonth).toHaveBeenCalledOnce();
  });

  it('B7: clicking edit button calls onStartEdit', async () => {
    const user = userEvent.setup();
    const onStartEdit = vi.fn();
    render(<BudgetHeader {...defaultProps} onStartEdit={onStartEdit} />);
    await user.click(screen.getByRole('button', { name: 'Editar' }));
    expect(onStartEdit).toHaveBeenCalledOnce();
  });

  it('B8: clicking a month chip calls onMonthChange', async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    render(<BudgetHeader {...defaultProps} onMonthChange={onMonthChange} />);
    await user.click(screen.getByRole('button', { name: 'Ir a Febrero 2026 (sin presupuesto)' }));
    expect(onMonthChange).toHaveBeenCalledWith('2026-02');
  });

  it('B9: active chip changes when the selected month changes', () => {
    const { rerender } = render(<BudgetHeader {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Ir a Enero 2026' })).toHaveAttribute('aria-pressed', 'true');

    rerender(<BudgetHeader {...defaultProps} selectedMonthValue="2026-02" />);
    expect(screen.getByRole('button', { name: 'Ir a Febrero 2026 (sin presupuesto)' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Ir a Enero 2026' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('B10: next arrow shows the destination month in its title', () => {
    render(<BudgetHeader {...defaultProps} nextMonthLabel="Mayo 2026" />);
    expect(screen.getByRole('button', { name: 'Mes siguiente' })).toHaveAttribute('title', 'Ir a Mayo 2026');
  });

  it('B11: the current month card shows (Actual) inside and is clickable', async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    render(
      <BudgetHeader
        {...defaultProps}
        monthOptions={[
          { value: '2026-01', label: 'Enero 2026', hasBudget: true, isCurrent: true },
          { value: '2026-02', label: 'Febrero 2026', hasBudget: false, isCurrent: false },
        ]}
        onMonthChange={onMonthChange}
      />
    );

    expect(screen.getByText('Enero 2026').closest('button')).not.toBeNull();
    expect(screen.getByText('(Actual)').closest('button')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Ir a Enero 2026' }));
    expect(onMonthChange).toHaveBeenCalledWith('2026-01');
  });
});
