import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { BudgetSummaryCard } from '../components/BudgetSummaryCard';
import { useBudgets } from '../hooks/useBudgets';
import { BudgetWithSpending } from '../types/budget.types';

jest.mock('../hooks/useBudgets', () => ({
  useBudgets: jest.fn(),
}));

const mockedHook = useBudgets as jest.MockedFunction<typeof useBudgets>;

function withSpending(overrides: Partial<BudgetWithSpending> = {}): BudgetWithSpending {
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
    spent: 10,
    remaining: 40,
    progress: 0.2,
    isOverBudget: false,
    subscriptionIds: [],
    ...overrides,
  };
}

function setHook(overrides: Partial<ReturnType<typeof useBudgets>> = {}) {
  mockedHook.mockReturnValue({
    budgets: [],
    budgetsWithSpending: [],
    loading: false,
    error: null,
    refetch: jest.fn().mockResolvedValue(undefined),
    create: jest.fn().mockResolvedValue({} as never),
    remove: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });
}

describe('BudgetSummaryCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the loading state', () => {
    setHook({ loading: true });
    const { getByTestId } = render(<BudgetSummaryCard />);
    expect(getByTestId('budget-summary-loading')).toBeTruthy();
  });

  it('renders the empty state with a CTA when no budgets', () => {
    setHook({ budgetsWithSpending: [] });
    const onCreate = jest.fn();
    const { getByTestId } = render(<BudgetSummaryCard onCreatePress={onCreate} />);
    expect(getByTestId('budget-summary-empty')).toBeTruthy();

    fireEvent.press(getByTestId('budget-summary-create-cta'));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('renders aggregated totals when budgets are present', () => {
    setHook({
      budgetsWithSpending: [
        withSpending({ id: 'a', amount: 50, spent: 10 }),
        withSpending({ id: 'b', amount: 100, spent: 90 }),
      ],
    });
    const { getByText, getByTestId } = render(<BudgetSummaryCard />);
    expect(getByTestId('budget-summary-card')).toBeTruthy();
    expect(getByText(/Mes budgets/)).toBeTruthy();
    expect(getByText(/67%/)).toBeTruthy();
  });

  it('navigates via onPress when the card is tapped', () => {
    setHook({ budgetsWithSpending: [withSpending()] });
    const onPress = jest.fn();
    const { getByTestId } = render(<BudgetSummaryCard onPress={onPress} />);
    fireEvent.press(getByTestId('budget-summary-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
