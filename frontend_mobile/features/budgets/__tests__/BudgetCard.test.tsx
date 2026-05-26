import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { BudgetCard } from '../components/BudgetCard';
import { BudgetWithSpending } from '../types/budget.types';

function makeBudget(overrides: Partial<BudgetWithSpending> = {}): BudgetWithSpending {
  return {
    id: 'b-1',
    name: 'Streaming',
    amount: 50,
    currency: 'EUR',
    period: 'monthly',
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-02-01T00:00:00.000Z',
    categoryId: null,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    spent: 12.5,
    remaining: 37.5,
    progress: 0.25,
    isOverBudget: false,
    ...overrides,
  };
}

describe('BudgetCard', () => {
  it('renders the budget name', () => {
    const { getByText } = render(<BudgetCard budget={makeBudget()} />);
    expect(getByText('Streaming')).toBeTruthy();
  });

  it('renders the monthly period label for monthly budgets', () => {
    const { getByText } = render(<BudgetCard budget={makeBudget({ period: 'monthly' })} />);
    expect(getByText('Mensuel')).toBeTruthy();
  });

  it('renders the yearly period label for yearly budgets', () => {
    const { getByText } = render(<BudgetCard budget={makeBudget({ period: 'yearly' })} />);
    expect(getByText('Annuel')).toBeTruthy();
  });

  it('shows the remaining amount when not over budget', () => {
    const { queryByText } = render(<BudgetCard budget={makeBudget()} />);
    expect(queryByText(/Restant/)).toBeTruthy();
  });

  it('shows the over-budget indicator when isOverBudget', () => {
    const { queryByText } = render(
      <BudgetCard
        budget={makeBudget({
          spent: 60,
          remaining: -10,
          progress: 1.2,
          isOverBudget: true,
        })}
      />,
    );
    expect(queryByText(/Dépassé/)).toBeTruthy();
  });

  it('renders the percent label rounded to nearest integer', () => {
    const { getByText } = render(
      <BudgetCard budget={makeBudget({ progress: 0.427 })} />,
    );
    expect(getByText(/43% utilisé/)).toBeTruthy();
  });

  it('invokes onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<BudgetCard budget={makeBudget()} onPress={onPress} />);
    fireEvent.press(getByTestId('budget-card-b-1'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not crash without an onPress handler', () => {
    expect(() => render(<BudgetCard budget={makeBudget()} />)).not.toThrow();
  });
});
