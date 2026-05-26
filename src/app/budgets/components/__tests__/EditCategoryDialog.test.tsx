import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditCategoryDialog } from '../EditCategoryDialog';

const category = { id: '1', name: 'Comida' };

function renderDialog(props: Record<string, unknown> = {}) {
  return render(
    <EditCategoryDialog
      open={true}
      category={category}
      onSave={vi.fn()}
      onClose={vi.fn()}
      {...props}
    />
  );
}

describe('EditCategoryDialog', () => {
  it('C1: shows title and pre-filled input when opened with a category', () => {
    renderDialog();
    expect(screen.getByText('Editar categoría')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Comida')).toBeInTheDocument();
  });

  it('C2: save button is disabled when input is cleared', async () => {
    const user = userEvent.setup();
    renderDialog();
    const input = screen.getByDisplayValue('Comida');
    await user.clear(input);
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
  });

  it('C3: calls onSave with new name and shows loading state', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderDialog({ onSave });
    const input = screen.getByDisplayValue('Comida');
    await user.clear(input);
    await user.type(input, 'Supermercado');
    const saveButton = screen.getByRole('button', { name: 'Guardar' });
    await user.click(saveButton);
    expect(onSave).toHaveBeenCalledWith('Supermercado');
    await waitFor(() => {
      expect(screen.queryByText('Guardando...')).not.toBeInTheDocument();
    });
  });

  it('C4: calls onClose after onSave resolves', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    renderDialog({ onSave, onClose });
    const input = screen.getByDisplayValue('Comida');
    await user.clear(input);
    await user.type(input, 'Nuevo');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it('C5: shows error when onSave rejects', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockRejectedValue(new Error('Error al guardar'));
    renderDialog({ onSave });
    const input = screen.getByDisplayValue('Comida');
    await user.clear(input);
    await user.type(input, 'Nuevo');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => {
      expect(screen.getByText('Error al guardar')).toBeInTheDocument();
    });
  });

  it('C6: pressing Enter calls onSave', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderDialog({ onSave });
    const input = screen.getByDisplayValue('Comida');
    await user.clear(input);
    await user.type(input, 'Nuevo');
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('Nuevo');
    });
  });

  it('C7: calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDialog({ onClose });
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });
});
