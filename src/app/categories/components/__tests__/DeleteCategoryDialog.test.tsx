import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteCategoryDialog } from '../DeleteCategoryDialog';
import type { Category } from '@/types/categories';

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const category: Category = {
  id: 'cat-1',
  userId: 'user-1',
  name: 'Comida',
  type: 'needs',
  transactionCount: 3,
};

const categories: Category[] = [
  category,
  { id: 'cat-2', userId: 'user-1', name: 'Restaurantes', type: 'leisure' },
  { id: 'cat-3', userId: 'user-1', name: 'Supermercado', type: 'needs' },
];

describe('DeleteCategoryDialog — nuevo diseño', () => {
  it('muestra el título, el número de movimientos y el aviso de presupuestos', () => {
    render(
      <DeleteCategoryDialog
        open
        category={category}
        categories={categories}
        saving={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('sm:max-w-[560px]');
    expect(screen.getByRole('heading', { name: 'Eliminar categoría «Comida»' })).toBeInTheDocument();
    expect(screen.getByText('Tiene 3 movimientos. ¿Qué hacemos con ellos?')).toBeInTheDocument();
    expect(screen.getByText('También se quitará de los presupuestos.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eliminar categoría' })).toBeInTheDocument();
  });

  it('deja los movimientos sin categoría por defecto', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <DeleteCategoryDialog
        open
        category={category}
        categories={categories}
        saving={false}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByRole('radio', { name: 'Dejarlos sin categoría' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Eliminar categoría' }));
    expect(onConfirm).toHaveBeenCalledWith(undefined);
  });

  it('permite mover los movimientos a otra categoría excluyendo la que se elimina', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <DeleteCategoryDialog
        open
        category={category}
        categories={categories}
        saving={false}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    await user.click(screen.getByRole('radio', { name: 'Moverlos a otra categoría' }));

    expect(screen.getByRole('combobox', { name: 'Categoría' })).toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: 'Categoría' }));
    expect(screen.queryByRole('option', { name: 'Comida' })).not.toBeInTheDocument();
    await user.click(await screen.findByRole('option', { name: 'Restaurantes' }));
    await user.click(screen.getByRole('button', { name: 'Eliminar categoría' }));

    expect(onConfirm).toHaveBeenCalledWith('cat-2');
  });

  it('usa singular cuando solo tiene un movimiento', () => {
    render(
      <DeleteCategoryDialog
        open
        category={{ ...category, transactionCount: 1 }}
        categories={categories}
        saving={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText('Tiene 1 movimiento. ¿Qué hacemos con ellos?')).toBeInTheDocument();
  });
});
