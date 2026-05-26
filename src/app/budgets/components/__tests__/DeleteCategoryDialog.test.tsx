import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteCategoryDialog } from '../DeleteCategoryDialog';

function renderDialog(props: Record<string, unknown> = {}) {
  return render(
    <DeleteCategoryDialog
      open={true}
      categoryName="Comida"
      onConfirm={vi.fn()}
      onClose={vi.fn()}
      {...props}
    />
  );
}

describe('DeleteCategoryDialog', () => {
  it('D1: shows title and category name in confirmation', () => {
    renderDialog();
    expect(screen.getByText('Eliminar categoría')).toBeInTheDocument();
    expect(screen.getByText(/Comida/)).toBeInTheDocument();
  });

  it('D2: calls onConfirm and disables buttons during operation', async () => {
    const user = userEvent.setup();
    let resolvePromise: () => void = () => {};
    const onConfirm = vi.fn().mockImplementation(() => new Promise<void>((resolve) => {
      resolvePromise = resolve;
    }));
    renderDialog({ onConfirm });
    const deleteButton = screen.getByRole('button', { name: 'Eliminar' });
    await user.click(deleteButton);
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(deleteButton).toBeDisabled();
    resolvePromise();
  });

  it('D3: calls onClose after onConfirm resolves', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    renderDialog({ onConfirm, onClose });
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it('D5: calls onClose when clicking Cancelar', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDialog({ onClose });
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
