import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryDialog } from '../CategoryDialog';
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
};

describe('CategoryDialog — nuevo diseño', () => {
  it('usa un modal de 560 px con título y descripción', () => {
    render(
      <CategoryDialog
        open
        category={category}
        saving={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('sm:max-w-[560px]');
    expect(screen.getByRole('heading', { name: 'Editar categoría' })).toBeInTheDocument();
    expect(screen.getByText('Cambia el nombre o el tipo de la categoría')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument();
  });

  it('avisa del cambio de tipo desde el mes actual cuando se edita', async () => {
    const user = userEvent.setup();
    render(
      <CategoryDialog
        open
        category={category}
        saving={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    await user.click(screen.getByRole('combobox', { name: 'Tipo' }));
    await user.click(await screen.findByRole('option', { name: 'Ocio' }));

    expect(
      screen.getByText(/Pasar de Necesidades a Ocio cambia dónde cuenta «Comida» en el presupuesto desde \w+ \d{4}\. Los meses anteriores no cambian\./)
    ).toBeInTheDocument();
  });

  it('no muestra el aviso si el tipo no cambia', () => {
    render(
      <CategoryDialog
        open
        category={category}
        saving={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.queryByText(/cambia dónde cuenta/)).not.toBeInTheDocument();
  });

  it('no muestra el aviso al crear una categoría', () => {
    render(
      <CategoryDialog
        open
        category={null}
        saving={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Nueva categoría' })).toBeInTheDocument();
    expect(screen.queryByText(/cambia dónde cuenta/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear categoría' })).toBeInTheDocument();
  });
});
