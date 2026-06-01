import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RecurringCard } from '../RecurringCard';

describe('RecurringCard', () => {
  const paidSubscriptions = [
    { name: 'Netflix', amount: 15.99, frequency: 'monthly', status: 'paid', lastChargeDate: '2026-05-15T00:00:00.000Z', nextChargeDate: '2026-06-15T00:00:00.000Z' },
    { name: 'Spotify', amount: 9.99, frequency: 'monthly', status: 'paid', lastChargeDate: '2026-05-10T00:00:00.000Z', nextChargeDate: '2026-06-10T00:00:00.000Z' },
  ];

  const pendingSubscriptions = [
    { name: 'Netflix', amount: 15.99, frequency: 'monthly', status: 'pending', lastChargeDate: '2026-04-15T00:00:00.000Z', nextChargeDate: '2026-05-15T00:00:00.000Z' },
  ];

  const noDateSubscriptions = [
    { name: 'Netflix', amount: 15.99, frequency: 'monthly', status: 'pending', lastChargeDate: null, nextChargeDate: null },
  ];

  const mixedSubscriptions = [
    { name: 'Netflix', amount: 15.99, frequency: 'monthly', status: 'paid', lastChargeDate: '2026-05-15T00:00:00.000Z', nextChargeDate: '2026-06-15T00:00:00.000Z' },
    { name: 'Spotify', amount: 9.99, frequency: 'monthly', status: 'pending', lastChargeDate: '2026-04-10T00:00:00.000Z', nextChargeDate: '2026-05-10T00:00:00.000Z' },
  ];

  it('renders a card titled Recurrentes', () => {
    render(<RecurringCard subscriptions={paidSubscriptions} />);
    expect(screen.getByText('Recurrentes')).toBeInTheDocument();
  });

  it('shows subscription names and amounts', () => {
    render(<RecurringCard subscriptions={paidSubscriptions} />);
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('Spotify')).toBeInTheDocument();
    expect(screen.getByText(/15,99/)).toBeInTheDocument();
  });

  it('shows Pagada badge for paid subscriptions', () => {
    render(<RecurringCard subscriptions={paidSubscriptions} />);
    const badges = screen.getAllByText('Pagada');
    expect(badges.length).toBe(2);
  });

  it('shows Pendiente badge for pending subscriptions', () => {
    render(<RecurringCard subscriptions={pendingSubscriptions} />);
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('shows lastChargeDate formatted as short date', () => {
    render(<RecurringCard subscriptions={paidSubscriptions} />);
    expect(screen.getByText('Último cobro: 15 May')).toBeInTheDocument();
    expect(screen.getByText('Último cobro: 10 May')).toBeInTheDocument();
  });

  it('shows nextChargeDate as Próximo cobro with short date format', () => {
    render(<RecurringCard subscriptions={mixedSubscriptions} />);
    expect(screen.getByText('Próximo cobro: 10 May')).toBeInTheDocument();
  });

  it('does not render dates when lastChargeDate and nextChargeDate are null', () => {
    render(<RecurringCard subscriptions={noDateSubscriptions} />);
    expect(screen.queryByText('Próximo cobro:')).not.toBeInTheDocument();
    expect(screen.queryByText(/\/2026/)).not.toBeInTheDocument();
  });

  it('renders empty state gracefully', () => {
    const { container } = render(<RecurringCard subscriptions={[]} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders a link to manage subscriptions', () => {
    render(<RecurringCard subscriptions={paidSubscriptions} />);
    const link = screen.getByRole('link', { name: 'Gestionar suscripciones' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/subscriptions');
  });
});
