import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';

function renderDialog(props: Record<string, unknown> = {}) {
  return render(
    <ConfirmDeleteDialog
      open={true}
      title="Eliminar categoría"
      description={<>¿Estás seguro de que quieres eliminar la categoría <strong>Comida</strong>?</>}
      onConfirm={vi.fn()}
      onCancel={vi.fn()}
      {...props}
    />
  );
}

describe('ConfirmDeleteDialog (budgets)', () => {
  it('shows title and category name in confirmation', () => {
    renderDialog();
    expect(screen.getByText('Eliminar categoría')).toBeInTheDocument();
    expect(screen.getByText(/Comida/)).toBeInTheDocument();
  });

  it('disables confirm button when loading', () => {
    renderDialog({ loading: true });
    expect(screen.getByRole('button', { name: 'Eliminando...' })).toBeDisabled();
  });

  it('calls onConfirm when clicking Eliminar', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderDialog({ onConfirm });
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when clicking Cancelar', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderDialog({ onCancel });
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
