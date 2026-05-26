import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BudgetHeader } from '../BudgetHeader';

const defaultProps = {
  monthLabel: 'Enero 2026',
  badge: { text: 'Editando', className: 'bg-amber-100 text-amber-700' },
  canGoBack: true,
  canGoForward: true,
  showEditButton: true,
  editButtonLabel: 'Editar',
  onPrevMonth: vi.fn(),
  onNextMonth: vi.fn(),
  onStartEdit: vi.fn(),
};

describe('BudgetHeader', () => {
  it('B1: renders month label, badge, nav arrows, and edit button', () => {
    render(<BudgetHeader {...defaultProps} />);
    expect(screen.getByText('Enero 2026')).toBeInTheDocument();
    expect(screen.getByText('Editando')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
  });

  it('B2: prev arrow is disabled when canGoBack is false', () => {
    render(<BudgetHeader {...defaultProps} canGoBack={false} />);
    const editButton = screen.getByRole('button', { name: 'Editar' });
    const prevArrow = screen.getAllByRole('button').find(b => b !== editButton);
    expect(prevArrow).toBeDisabled();
  });

  it('B3: next arrow is disabled when canGoForward is false', () => {
    render(<BudgetHeader {...defaultProps} canGoForward={false} />);
    const buttons = screen.getAllByRole('button');
    const editButton = screen.getByRole('button', { name: 'Editar' });
    const arrowButtons = buttons.filter(b => b !== editButton);
    expect(arrowButtons[arrowButtons.length - 1]).toBeDisabled();
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
    const editButton = screen.getByRole('button', { name: 'Editar' });
    const prevArrow = screen.getAllByRole('button').find(b => b !== editButton)!;
    await user.click(prevArrow);
    expect(onPrevMonth).toHaveBeenCalledOnce();
  });

  it('B7: clicking edit button calls onStartEdit', async () => {
    const user = userEvent.setup();
    const onStartEdit = vi.fn();
    render(<BudgetHeader {...defaultProps} onStartEdit={onStartEdit} />);
    await user.click(screen.getByRole('button', { name: 'Editar' }));
    expect(onStartEdit).toHaveBeenCalledOnce();
  });
});
