import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { BudgetFormScreen } from '../screens/BudgetFormScreen';
import { useBudget } from '../hooks/useBudget';
import { budgetsApi } from '../api/budgets.api';

jest.mock('@/services/api/category.service', () => ({
  categoryService: {
    getAll: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('@/services/api', () => ({
  subscriptionService: {
    getAll: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../hooks/useBudget', () => ({
  useBudget: jest.fn(),
}));

jest.mock('../api/budgets.api', () => ({
  budgetsApi: {
    create: jest.fn(),
    update: jest.fn(),
  },
}));

const mockedUseBudget = useBudget as jest.MockedFunction<typeof useBudget>;
const mockedApi = budgetsApi as jest.Mocked<typeof budgetsApi>;

function setHook(overrides: Partial<ReturnType<typeof useBudget>> = {}) {
  mockedUseBudget.mockReturnValue({
    budget: null,
    budgetWithSpending: null,
    loading: false,
    error: null,
    refetch: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue({} as never),
    ...overrides,
  });
}

describe('BudgetFormScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the create title when no id is supplied', async () => {
    setHook();
    const { getByText } = render(<BudgetFormScreen budgetId={null} />);
    await waitFor(() => expect(getByText('Nouveau budget')).toBeTruthy());
  });

  it('shows the edit title when an id is supplied', async () => {
    setHook({
      budget: {
        id: 'b-1',
        name: 'Streaming',
        amount: 50,
        currency: 'EUR',
        period: 'monthly',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: null,
        categoryId: null,
        subscriptionIds: [],
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    const { getByText } = render(<BudgetFormScreen budgetId="b-1" />);
    await waitFor(() => expect(getByText('Modifier le budget')).toBeTruthy());
  });

  it('blocks submit when required fields are empty', async () => {
    setHook();
    const { getByTestId } = render(<BudgetFormScreen budgetId={null} />);
    await waitFor(() => expect(getByTestId('budget-form-submit')).toBeTruthy());
    fireEvent.press(getByTestId('budget-form-submit'));
    expect(mockedApi.create).not.toHaveBeenCalled();
  });

  it('submits create with the form values', async () => {
    setHook();
    const onDone = jest.fn();
    const { getByTestId } = render(<BudgetFormScreen budgetId={null} onDone={onDone} />);
    await waitFor(() => expect(getByTestId('budget-form-name')).toBeTruthy());

    fireEvent.changeText(getByTestId('budget-form-name'), 'Streaming');
    fireEvent.changeText(getByTestId('budget-form-amount'), '50');
    fireEvent.changeText(getByTestId('budget-form-currency'), 'EUR');

    mockedApi.create.mockResolvedValueOnce({
      id: 'b-new',
      name: 'Streaming',
      amount: 50,
      currency: 'EUR',
      period: 'monthly',
      startDate: new Date().toISOString(),
      endDate: null,
      categoryId: null,
      subscriptionIds: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    fireEvent.press(getByTestId('budget-form-submit'));
    await waitFor(() => expect(mockedApi.create).toHaveBeenCalled());

    expect(mockedApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Streaming', amount: 50, currency: 'EUR' }),
    );
    expect(onDone).toHaveBeenCalled();
  });

  it('submits update via the hook when in edit mode', async () => {
    const update = jest.fn().mockResolvedValue({});
    setHook({
      update,
      budget: {
        id: 'b-1',
        name: 'Streaming',
        amount: 50,
        currency: 'EUR',
        period: 'monthly',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: null,
        categoryId: null,
        subscriptionIds: [],
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    const onDone = jest.fn();
    const { getByTestId } = render(<BudgetFormScreen budgetId="b-1" onDone={onDone} />);
    await waitFor(() => expect(getByTestId('budget-form-name')).toBeTruthy());

    fireEvent.changeText(getByTestId('budget-form-name'), 'Streaming Updated');
    fireEvent.press(getByTestId('budget-form-submit'));

    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Streaming Updated' }),
    );
    expect(onDone).toHaveBeenCalled();
  });
});
