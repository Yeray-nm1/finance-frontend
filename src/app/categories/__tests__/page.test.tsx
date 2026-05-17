import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/lib/api', () => ({
  api: {
    categories: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { api } from '@/lib/api';
import CategoriesPage from '../page';

const mockCategories = [
  { id: 'cat-1', name: 'Comida', type: 'needs', userId: '1' },
  { id: 'cat-2', name: 'Cine', type: 'leisure', userId: '1' },
];

describe('CategoriesPage - optimistic updates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.categories.list as ReturnType<typeof vi.fn>).mockResolvedValue(mockCategories);
    (api.categories.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'cat-3',
      name: 'Transporte',
      type: 'needs',
      userId: '1',
    });
    (api.categories.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it('C03: creates category and shows it without refetching list', async () => {
    const user = userEvent.setup();
    render(<CategoriesPage />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
    });
    expect(api.categories.list).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /anadir/i }));
    await user.type(screen.getByLabelText('Nombre'), 'Transporte');
    await user.click(screen.getByRole('button', { name: /crear/i }));

    await waitFor(() => {
      expect(screen.getByText('Transporte')).toBeInTheDocument();
    });
    expect(api.categories.list).toHaveBeenCalledTimes(1);
  });

  it('C04: deletes category and removes it without refetching list', async () => {
    const user = userEvent.setup();
    render(<CategoriesPage />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
    });
    expect(api.categories.list).toHaveBeenCalledTimes(1);

    const deleteButton = screen.getAllByRole('button')[2];
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText('Comida')).not.toBeInTheDocument();
    });
    expect(api.categories.list).toHaveBeenCalledTimes(1);
  });
});
