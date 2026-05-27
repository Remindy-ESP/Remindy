import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useBudgets } from '../hooks/useBudgets';
import { budgetsApi } from '../api/budgets.api';
import { Budget, BudgetWithSpending, CreateBudgetInput } from '../types/budget.types';

jest.mock('../api/budgets.api', () => ({
  budgetsApi: {
    list: jest.fn(),
    listWithSpending: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  },
}));

const mockedApi = budgetsApi as jest.Mocked<typeof budgetsApi>;

function makeBudget(overrides: Partial<Budget> = {}): Budget {
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
    subscriptionIds: [],
    ...overrides,
  };
}

function makeWithSpending(overrides: Partial<BudgetWithSpending> = {}): BudgetWithSpending {
  return {
    ...makeBudget(overrides),
    spent: 10,
    remaining: 40,
    progress: 0.2,
    isOverBudget: false,
    ...overrides,
  };
}

describe('useBudgets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads the budgets via the basic endpoint by default', async () => {
    const budgets = [makeBudget(), makeBudget({ id: 'b-2' })];
    mockedApi.list.mockResolvedValue(budgets);

    const { result } = renderHook(() => useBudgets());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedApi.list).toHaveBeenCalledWith({ isActive: undefined, categoryId: undefined });
    expect(result.current.budgets).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('loads the budgets via the with-spending endpoint when requested', async () => {
    const items = [makeWithSpending(), makeWithSpending({ id: 'b-2' })];
    mockedApi.listWithSpending.mockResolvedValue(items);

    const { result } = renderHook(() => useBudgets({ withSpending: true }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedApi.listWithSpending).toHaveBeenCalled();
    expect(result.current.budgetsWithSpending).toHaveLength(2);
  });

  it('forwards filters to the api', async () => {
    mockedApi.list.mockResolvedValue([]);

    renderHook(() => useBudgets({ filters: { isActive: true, categoryId: 'cat-1' } }));

    await waitFor(() => expect(mockedApi.list).toHaveBeenCalled());

    expect(mockedApi.list).toHaveBeenCalledWith({ isActive: true, categoryId: 'cat-1' });
  });

  it('captures errors from the api', async () => {
    mockedApi.list.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useBudgets());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('boom');
    expect(result.current.budgets).toEqual([]);
  });

  it('creates a budget and updates the list optimistically', async () => {
    mockedApi.list.mockResolvedValue([]);
    const created = makeBudget({ id: 'b-new', name: 'New' });
    mockedApi.create.mockResolvedValue(created);

    const { result } = renderHook(() => useBudgets());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const input: CreateBudgetInput = {
      name: 'New',
      amount: 50,
      currency: 'EUR',
      period: 'monthly',
      startDate: '2026-01-01T00:00:00.000Z',
    };

    await act(async () => {
      await result.current.create(input);
    });

    expect(mockedApi.create).toHaveBeenCalledWith(input);
  });

  it('removes a budget optimistically and refetches on error', async () => {
    const budgets = [makeBudget({ id: 'b-1' }), makeBudget({ id: 'b-2' })];
    mockedApi.list.mockResolvedValue(budgets);
    mockedApi.remove.mockResolvedValue(undefined);

    const { result } = renderHook(() => useBudgets());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.remove('b-1');
    });

    expect(mockedApi.remove).toHaveBeenCalledWith('b-1');
    expect(result.current.budgets.find(b => b.id === 'b-1')).toBeUndefined();
  });

  it('rolls back on remove failure', async () => {
    const budgets = [makeBudget({ id: 'b-1' }), makeBudget({ id: 'b-2' })];
    mockedApi.list.mockResolvedValue(budgets);
    mockedApi.remove.mockRejectedValue(new Error('nope'));

    const { result } = renderHook(() => useBudgets());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.remove('b-1')).rejects.toThrow('nope');
    });

    expect(result.current.budgets).toHaveLength(2);
  });
});
