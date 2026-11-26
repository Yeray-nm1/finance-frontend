import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BudgetTypeTabs } from '../BudgetTypeTabs';

const allocations = [
  { type: 'needs', percentage: 50 },
  { type: 'leisure', percentage: 20 },
  { type: 'savings', percentage: 15 },
  { type: 'other', percentage: 15 },
];

function renderDefault(props: Record<string, unknown> = {}) {
  return render(
    <BudgetTypeTabs
      typeAllocations={allocations}
      selectedType="needs"
      totalIncome={2000}
      onSelectType={vi.fn()}
      onPercentageChange={vi.fn()}
      {...props}
    />
  );
}

describe('BudgetTypeTabs', () => {
  it('muestra las cuatro tarjetas de grupo en una sola fila desplazable', () => {
    const { container } = renderDefault();

    expect(screen.getByRole('button', { name: /Necesidades/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ocio/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ahorro/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Otros/ })).toBeInTheDocument();
    expect(container.firstElementChild?.className).toContain('overflow-x-auto');
  });

  it('muestra el porcentaje editable y el importe de cada grupo', () => {
    renderDefault();

    expect(screen.getByRole('spinbutton', { name: 'Porcentaje de Necesidades' })).toHaveValue(50);
    expect(screen.getByRole('button', { name: 'Necesidades' }).parentElement).toHaveTextContent('1.000,00');
    expect(screen.getByRole('button', { name: 'Ocio' }).parentElement).toHaveTextContent('400,00');
    expect(screen.getByRole('button', { name: 'Ahorro' }).parentElement).toHaveTextContent('300,00');
  });

  it('marca el grupo seleccionado', () => {
    renderDefault();

    expect(screen.getByRole('button', { name: /Necesidades/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Ocio/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('selecciona otro grupo', async () => {
    const user = userEvent.setup();
    const onSelectType = vi.fn();
    renderDefault({ onSelectType });

    await user.click(screen.getByRole('button', { name: /Ocio/ }));

    expect(onSelectType).toHaveBeenCalledWith('leisure');
  });

  it('permite editar el porcentaje del grupo', () => {
    const onPercentageChange = vi.fn();
    renderDefault({ onPercentageChange });

    const input = screen.getByRole('spinbutton', { name: 'Porcentaje de Necesidades' });
    fireEvent.change(input, { target: { value: '45' } });

    expect(onPercentageChange).toHaveBeenLastCalledWith('needs', 45);
  });
});
