import { renderHook, act } from '@testing-library/react-native';
import { useStorageQuota } from '../useStorageQuota';
import { storageService } from '../../services/api';
import type { StorageQuota } from '../../services/api/types';

jest.mock('../../services/api', () => ({
  storageService: {
    getQuota: jest.fn(),
  },
}));

const mockStorageService = storageService as jest.Mocked<typeof storageService>;

const mockQuota: StorageQuota = {
  totalBytes: 1073741824, // 1 GB
  usedBytes: 268435456,   // 256 MB
  availableBytes: 805306368, // 768 MB
  usagePercentage: 25,
  documentCount: 42,
  totalFormatted: '1 GB',
  usedFormatted: '256 MB',
  availableFormatted: '768 MB',
};

describe('useStorageQuota', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts with null quota, not loading, no error', () => {
      const { result } = renderHook(() => useStorageQuota());

      expect(result.current.quota).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('exposes fetchQuota function', () => {
      const { result } = renderHook(() => useStorageQuota());

      expect(typeof result.current.fetchQuota).toBe('function');
    });
  });

  describe('fetchQuota', () => {
    it('fetches and sets quota successfully', async () => {
      mockStorageService.getQuota.mockResolvedValue(mockQuota);

      const { result } = renderHook(() => useStorageQuota());

      await act(async () => {
        await result.current.fetchQuota();
      });

      expect(result.current.quota).toEqual(mockQuota);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('calls storageService.getQuota once', async () => {
      mockStorageService.getQuota.mockResolvedValue(mockQuota);

      const { result } = renderHook(() => useStorageQuota());

      await act(async () => {
        await result.current.fetchQuota();
      });

      expect(mockStorageService.getQuota).toHaveBeenCalledTimes(1);
    });

    it('sets loading to true during the fetch and back to false after', async () => {
      let resolvePromise!: (value: StorageQuota) => void;
      const pendingPromise = new Promise<StorageQuota>((resolve) => {
        resolvePromise = resolve;
      });
      mockStorageService.getQuota.mockReturnValue(pendingPromise);

      const { result } = renderHook(() => useStorageQuota());

      // Start fetch but don't await so we can check intermediate state
      act(() => {
        result.current.fetchQuota();
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise(mockQuota);
      });

      expect(result.current.loading).toBe(false);
    });

    it('sets error when fetch fails with an Error', async () => {
      mockStorageService.getQuota.mockRejectedValue(new Error('Quota unavailable'));

      const { result } = renderHook(() => useStorageQuota());

      await act(async () => {
        await result.current.fetchQuota();
      });

      expect(result.current.error).toBe('Quota unavailable');
      expect(result.current.loading).toBe(false);
      expect(result.current.quota).toBeNull();
    });

    it('sets generic error for non-Error rejections', async () => {
      mockStorageService.getQuota.mockRejectedValue('some string error');

      const { result } = renderHook(() => useStorageQuota());

      await act(async () => {
        await result.current.fetchQuota();
      });

      expect(result.current.error).toBe('Echec du chargement du quota de stockage');
    });

    it('clears previous error before re-fetching', async () => {
      mockStorageService.getQuota.mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useStorageQuota());

      await act(async () => {
        await result.current.fetchQuota();
      });
      expect(result.current.error).toBe('First error');

      mockStorageService.getQuota.mockResolvedValueOnce(mockQuota);

      await act(async () => {
        await result.current.fetchQuota();
      });
      expect(result.current.error).toBeNull();
      expect(result.current.quota).toEqual(mockQuota);
    });

    it('updates quota on repeated successful fetches', async () => {
      const quotaV1: StorageQuota = { ...mockQuota, usedBytes: 100000, usagePercentage: 10 };
      const quotaV2: StorageQuota = { ...mockQuota, usedBytes: 500000, usagePercentage: 50 };

      mockStorageService.getQuota
        .mockResolvedValueOnce(quotaV1)
        .mockResolvedValueOnce(quotaV2);

      const { result } = renderHook(() => useStorageQuota());

      await act(async () => {
        await result.current.fetchQuota();
      });
      expect(result.current.quota?.usagePercentage).toBe(10);

      await act(async () => {
        await result.current.fetchQuota();
      });
      expect(result.current.quota?.usagePercentage).toBe(50);
    });

    it('quota preserves all fields from the service response', async () => {
      mockStorageService.getQuota.mockResolvedValue(mockQuota);

      const { result } = renderHook(() => useStorageQuota());

      await act(async () => {
        await result.current.fetchQuota();
      });

      expect(result.current.quota?.totalBytes).toBe(1073741824);
      expect(result.current.quota?.usedBytes).toBe(268435456);
      expect(result.current.quota?.availableBytes).toBe(805306368);
      expect(result.current.quota?.usagePercentage).toBe(25);
      expect(result.current.quota?.documentCount).toBe(42);
      expect(result.current.quota?.totalFormatted).toBe('1 GB');
      expect(result.current.quota?.usedFormatted).toBe('256 MB');
      expect(result.current.quota?.availableFormatted).toBe('768 MB');
    });
  });
});
