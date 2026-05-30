import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DashboardError } from '../DashboardError';

describe('DashboardError', () => {
  const defaultProps = {
    error: 'Error al cargar los datos',
    onRetry: vi.fn(),
  };

  it('renders the error message', () => {
    render(<DashboardError {...defaultProps} />);
    expect(screen.getByText(/Error al cargar los datos/i)).toBeInTheDocument();
  });

  it('renders a "Reintentar" button', () => {
    render(<DashboardError {...defaultProps} />);
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('calls onRetry when "Reintentar" is clicked', async () => {
    const onRetry = vi.fn();
    render(<DashboardError error="Error" onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
