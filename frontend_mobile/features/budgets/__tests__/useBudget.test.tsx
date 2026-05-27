import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useBudget } from '../hooks/useBudget';
import { budgetsApi } from '../api/budgets.api';
import { Budget } from '../types/budget.types';

jest.mock('../api/budgets.api', () => ({
  budgetsApi: {
    getOne: jest.fn(),
    getOneWithSpending: jest.fn(),
    update: jest.fn(),
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
    endDate: null,
    categoryId: null,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    subscriptionIds: [],
    ...overrides,
  };
}

describe('useBudget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when id is null', async () => {
    const { result } = renderHook(() => useBudget(null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedApi.getOne).not.toHaveBeenCalled();
    expect(result.current.budget).toBeNull();
  });

  it('fetches the budget by id', async () => {
    mockedApi.getOne.mockResolvedValue(makeBudget());

    const { result } = renderHook(() => useBudget('b-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedApi.getOne).toHaveBeenCalledWith('b-1');
    expect(result.current.budget?.id).toBe('b-1');
  });

  it('captures fetch errors', async () => {
    mockedApi.getOne.mockRejectedValue(new Error('not found'));

    const { result } = renderHook(() => useBudget('b-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('not found');
    expect(result.current.budget).toBeNull();
  });

  it('updates the budget via the api', async () => {
    mockedApi.getOne.mockResolvedValue(makeBudget());
    mockedApi.update.mockResolvedValue(makeBudget({ name: 'Updated' }));

    const { result } = renderHook(() => useBudget('b-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.update({ name: 'Updated' });
    });

    expect(mockedApi.update).toHaveBeenCalledWith('b-1', { name: 'Updated' });
    expect(result.current.budget?.name).toBe('Updated');
  });

  it('throws when update is called without an id', async () => {
    const { result } = renderHook(() => useBudget(null));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.update({ name: 'x' })).rejects.toThrow(
        'Cannot update a budget without an id',
      );
    });
  });
});
