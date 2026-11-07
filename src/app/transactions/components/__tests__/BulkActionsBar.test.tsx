import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkActionsBar } from '../BulkActionsBar';
import type { Account } from '@/types/accounts';
import type { Category } from '@/types/categories';

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

const categories: Category[] = [
  { id: 'cat-1', userId: 'user-1', name: 'Comida', type: 'needs' },
];

const accounts: Account[] = [
  { id: 'acc-1', userId: 'user-1', name: 'Cuenta principal', type: 'checking', createdAt: new Date().toISOString() },
];

function buildProps(overrides: Record<string, unknown> = {}) {
  return {
    selectedCount: 2,
    categories,
    accounts,
    categoryId: '',
    accountId: '',
    applying: false,
    onCategoryChange: vi.fn(),
    onAccountChange: vi.fn(),
    onApply: vi.fn(),
    onDelete: vi.fn(),
    onClear: vi.fn(),
    ...overrides,
  };
}

describe('BulkActionsBar', () => {
  it('renders nothing without a selection', () => {
    const { container } = render(<BulkActionsBar {...buildProps({ selectedCount: 0 })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the selection count and triggers delete and clear', async () => {
    const user = userEvent.setup();
    const props = buildProps();

    render(<BulkActionsBar {...props} />);

    expect(screen.getByText('2 seleccionadas')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /eliminar/i }));
    await user.click(screen.getByRole('button', { name: /quitar seleccion/i }));

    expect(props.onDelete).toHaveBeenCalledOnce();
    expect(props.onClear).toHaveBeenCalledOnce();
  });

  it('disables apply until a category or an account is selected', async () => {
    const user = userEvent.setup();
    const props = buildProps();
    const { rerender } = render(<BulkActionsBar {...props} />);

    expect(screen.getByRole('button', { name: /aplicar/i })).toBeDisabled();

    rerender(<BulkActionsBar {...props} accountId="acc-1" />);
    expect(screen.getByRole('button', { name: /aplicar/i })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: /aplicar/i }));
    expect(props.onApply).toHaveBeenCalledOnce();
  });

  it('renders category and account selectors independently', () => {
    render(<BulkActionsBar {...buildProps({ categoryId: 'cat-1' })} />);

    expect(screen.getByLabelText('Categoria')).toBeInTheDocument();
    expect(screen.getByLabelText('Cuenta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /aplicar/i })).toBeEnabled();
  });

  it('clears category and account independently', async () => {
    const user = userEvent.setup();
    const props = buildProps({ categoryId: 'cat-1', accountId: 'acc-1' });
    render(<BulkActionsBar {...props} />);

    await user.click(screen.getByRole('button', { name: /limpiar categoria/i }));
    await user.click(screen.getByRole('button', { name: /limpiar cuenta/i }));

    expect(props.onCategoryChange).toHaveBeenCalledWith('');
    expect(props.onAccountChange).toHaveBeenCalledWith('');
  });

  it('labels the delete action with the number of selected transactions', () => {
    render(<BulkActionsBar {...buildProps()} />);

    expect(
      screen.getByRole('button', { name: /eliminar 2 transacciones seleccionadas/i })
    ).toHaveTextContent('Eliminar (2)');
  });
});
