import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { BudgetListScreen } from '../screens/BudgetListScreen';
import { useBudgets } from '../hooks/useBudgets';
import { BudgetWithSpending } from '../types/budget.types';

jest.mock('../hooks/useBudgets', () => ({
  useBudgets: jest.fn(),
}));

const mockedUseBudgets = useBudgets as jest.MockedFunction<typeof useBudgets>;

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
    ...overrides,
  };
}

function setHookState(overrides: Partial<ReturnType<typeof useBudgets>> = {}) {
  mockedUseBudgets.mockReturnValue({
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

describe('BudgetListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the loading state', () => {
    setHookState({ loading: true });
    const { getByText } = render(<BudgetListScreen />);
    expect(getByText('Chargement des budgets...')).toBeTruthy();
  });

  it('renders the error state', () => {
    setHookState({ error: 'boom' });
    const { getByText } = render(<BudgetListScreen />);
    expect(getByText(/Erreur : boom/)).toBeTruthy();
  });

  it('renders the empty state when no budgets', () => {
    setHookState({ budgetsWithSpending: [] });
    const { getByText, getByTestId } = render(<BudgetListScreen />);
    expect(getByText('Aucun budget pour l\'instant')).toBeTruthy();
    expect(getByTestId('budgets-empty-cta')).toBeTruthy();
  });

  it('invokes onCreatePress when the FAB is pressed', () => {
    setHookState({ budgetsWithSpending: [withSpending()] });
    const onCreate = jest.fn();
    const { getByTestId } = render(<BudgetListScreen onCreatePress={onCreate} />);
    fireEvent.press(getByTestId('budgets-fab'));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('renders one card per budget and navigates on tap', () => {
    setHookState({
      budgetsWithSpending: [
        withSpending({ id: 'b-1', name: 'A' }),
        withSpending({ id: 'b-2', name: 'B' }),
      ],
    });
    const onItem = jest.fn();
    const { getByText, getByTestId } = render(<BudgetListScreen onItemPress={onItem} />);
    expect(getByText('A')).toBeTruthy();
    expect(getByText('B')).toBeTruthy();

    fireEvent.press(getByTestId('budget-card-b-2'));
    expect(onItem).toHaveBeenCalledWith('b-2');
  });

  it('invokes onCreatePress when the empty CTA is pressed', () => {
    setHookState({ budgetsWithSpending: [] });
    const onCreate = jest.fn();
    const { getByTestId } = render(<BudgetListScreen onCreatePress={onCreate} />);
    fireEvent.press(getByTestId('budgets-empty-cta'));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });
});
