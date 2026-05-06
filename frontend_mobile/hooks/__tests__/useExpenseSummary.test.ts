import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useExpenseSummary } from '../useExpenseSummary';
import { statisticsService } from '../../services/api/statistics.service';
import type { Period } from '../../types/statistics';

jest.mock('../../services/api/statistics.service', () => ({
  statisticsService: { getExpenseSummary: jest.fn() },
}));

const mockedService = statisticsService as jest.Mocked<typeof statisticsService>;

const sample = {
  periodLabel: 'Octobre 2025',
  currentTotal: 203.85,
  previousTotal: 211.2,
  percentageChange: -3.5,
  trend: 'down' as const,
  comparisonLabel: 'Comparo M-1',
};

describe('useExpenseSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches the summary on mount', async () => {
    mockedService.getExpenseSummary.mockResolvedValue(sample);

    const { result } = renderHook(() => useExpenseSummary('month'));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(sample);
    expect(result.current.error).toBeNull();
    expect(mockedService.getExpenseSummary).toHaveBeenCalledWith('month');
  });

  it('refetches when the period changes', async () => {
    mockedService.getExpenseSummary.mockResolvedValue(sample);

    const { result, rerender } = renderHook(
      ({ period }: { period: Period }) => useExpenseSummary(period),
      { initialProps: { period: 'month' } },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedService.getExpenseSummary).toHaveBeenCalledTimes(1);

    rerender({ period: 'year' });
    await waitFor(() =>
      expect(mockedService.getExpenseSummary).toHaveBeenCalledTimes(2),
    );
    expect(mockedService.getExpenseSummary).toHaveBeenLastCalledWith('year');
  });

  it('exposes an error message and clears data when the request fails', async () => {
    mockedService.getExpenseSummary.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useExpenseSummary('month'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('boom');
    expect(result.current.data).toBeNull();
  });

  it('uses a generic error message when the rejection is not an Error', async () => {
    mockedService.getExpenseSummary.mockRejectedValue('weird');

    const { result } = renderHook(() => useExpenseSummary('month'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Failed to load expense summary');
  });

  it('refetch() triggers another request', async () => {
    mockedService.getExpenseSummary.mockResolvedValue(sample);

    const { result } = renderHook(() => useExpenseSummary('month'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedService.getExpenseSummary).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.refetch();
    });
    await waitFor(() =>
      expect(mockedService.getExpenseSummary).toHaveBeenCalledTimes(2),
    );
  });
});
