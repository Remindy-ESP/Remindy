import { renderHook, waitFor } from '@testing-library/react-native';
import { useComparison } from '../hooks/useComparison';
import { comparisonApi } from '../api/comparison.api';

jest.mock('../api/comparison.api', () => ({
  comparisonApi: { fetch: jest.fn() },
}));

const mockedApi = comparisonApi as jest.Mocked<typeof comparisonApi>;

function buildRange() {
  return {
    start: new Date('2026-05-01T00:00:00Z'),
    end: new Date('2026-06-01T00:00:00Z'),
    previousStart: new Date('2026-04-01T00:00:00Z'),
    previousEnd: new Date('2026-05-01T00:00:00Z'),
  };
}

describe('useComparison', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when range is null', async () => {
    const { result } = renderHook(() => useComparison({ range: null }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedApi.fetch).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });

  it('returns null when disabled', async () => {
    const { result } = renderHook(() =>
      useComparison({ range: buildRange(), enabled: false }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedApi.fetch).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });

  it('fetches the comparison when range and enabled are set', async () => {
    const payload = {
      current: { start: '2026-05-01', end: '2026-06-01', total: 50 },
      previous: { start: '2026-04-01', end: '2026-05-01', total: 40 },
      delta: 10,
      percentageChange: 25,
      trend: 'up' as const,
    };
    mockedApi.fetch.mockResolvedValue(payload);

    const { result } = renderHook(() => useComparison({ range: buildRange() }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedApi.fetch).toHaveBeenCalledWith(
      expect.objectContaining({ currentStart: expect.any(Date) }),
    );
    expect(result.current.data).toEqual(payload);
  });

  it('captures errors', async () => {
    mockedApi.fetch.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useComparison({ range: buildRange() }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('boom');
    expect(result.current.data).toBeNull();
  });

  it('forwards categoryId to the api', async () => {
    mockedApi.fetch.mockResolvedValue({
      current: { start: '', end: '', total: 0 },
      previous: { start: '', end: '', total: 0 },
      delta: 0,
      percentageChange: 0,
      trend: 'stable',
    });

    renderHook(() => useComparison({ range: buildRange(), categoryId: 'cat-1' }));
    await waitFor(() => expect(mockedApi.fetch).toHaveBeenCalled());

    expect(mockedApi.fetch).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'cat-1' }),
    );
  });
});
