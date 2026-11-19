import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

// El filtro de calendario importa CSS de terceros; este test solo cubre los chips.
vi.mock('../CalendarFilter', () => ({ CalendarFilter: () => null }));

import { TransactionsFilters } from '../TransactionsFilters';

const onClearFilters = vi.fn();

const baseProps = {
  filterType: '' as const,
  filterFlow: '' as const,
  filterCategoryIds: [],
  filterAccountIds: [],
  filterSearch: '',
  filterSubscriptionIds: [],
  filterDates: {},
  accounts: [],
  categories: [],
  subscriptions: [],
  hasActiveFilters: true,
  isDefaultSort: true,
  onFilterTypeChange: vi.fn(),
  onFilterCategoryIdsChange: vi.fn(),
  onFilterAccountIdsChange: vi.fn(),
  onFilterSearchChange: vi.fn(),
  onFilterSubscriptionIdsChange: vi.fn(),
  onFilterDatesChange: vi.fn(),
  onResetSort: vi.fn(),
  onClearFilters,
};

describe('TransactionsFilters · filtro por meta', () => {
  it('3B muestra el chip «Meta: <nombre> ×» y permite quitar solo ese filtro', async () => {
    const user = userEvent.setup();
    const onFilterGoalIdClear = vi.fn();

    render(
      <TransactionsFilters
        {...baseProps}
        filterGoalId="goal-1"
        goalName="Viaje a Japón"
        onFilterGoalIdClear={onFilterGoalIdClear}
      />
    );

    expect(screen.getByRole('group', { name: 'Filtro de meta' })).toHaveTextContent(
      'Meta: Viaje a Japón'
    );
    await user.click(screen.getByRole('button', { name: 'Quitar filtro Meta' }));

    expect(onFilterGoalIdClear).toHaveBeenCalledOnce();
    expect(onClearFilters).not.toHaveBeenCalled();
  });

  it('3B no muestra el chip cuando no hay meta filtrada', () => {
    render(
      <TransactionsFilters
        {...baseProps}
        filterGoalId={null}
        goalName={null}
        onFilterGoalIdClear={vi.fn()}
      />
    );

    expect(screen.queryByRole('group', { name: 'Filtro de meta' })).not.toBeInTheDocument();
  });
});
