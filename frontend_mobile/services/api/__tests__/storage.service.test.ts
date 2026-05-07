import storageService from '../storage.service';
import apiClient from '../client';
import { StorageQuota } from '../types';

// Mock the API client
jest.mock('../client');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockQuota: StorageQuota = {
    totalBytes: 104857600,
    usedBytes: 15728640,
    availableBytes: 89128960,
    usagePercentage: 15,
    documentCount: 12,
    totalFormatted: '100 MB',
    usedFormatted: '15 MB',
    availableFormatted: '85 MB',
  };

  describe('getQuota', () => {
    it('fetches storage quota', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockQuota });

      const result = await storageService.getQuota();

      expect(mockApiClient.get).toHaveBeenCalledWith('/storage/quota');
      expect(result).toEqual(mockQuota);
    });

    it('returns quota with correct byte values', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockQuota });

      const result = await storageService.getQuota();

      expect(result.totalBytes).toBe(104857600);
      expect(result.usedBytes).toBe(15728640);
      expect(result.availableBytes).toBe(89128960);
    });

    it('returns quota with formatted strings', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockQuota });

      const result = await storageService.getQuota();

      expect(result.totalFormatted).toBe('100 MB');
      expect(result.usedFormatted).toBe('15 MB');
      expect(result.availableFormatted).toBe('85 MB');
    });

    it('returns quota with usage percentage', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockQuota });

      const result = await storageService.getQuota();

      expect(result.usagePercentage).toBe(15);
    });

    it('returns quota with document count', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockQuota });

      const result = await storageService.getQuota();

      expect(result.documentCount).toBe(12);
    });

    it('returns quota when storage is empty', async () => {
      const emptyQuota: StorageQuota = {
        totalBytes: 104857600,
        usedBytes: 0,
        availableBytes: 104857600,
        usagePercentage: 0,
        documentCount: 0,
        totalFormatted: '100 MB',
        usedFormatted: '0 B',
        availableFormatted: '100 MB',
      };

      mockApiClient.get.mockResolvedValue({ data: emptyQuota });

      const result = await storageService.getQuota();

      expect(result.usedBytes).toBe(0);
      expect(result.documentCount).toBe(0);
      expect(result.usagePercentage).toBe(0);
    });

    it('returns quota when storage is nearly full', async () => {
      const nearlyFullQuota: StorageQuota = {
        totalBytes: 104857600,
        usedBytes: 99614720,
        availableBytes: 5242880,
        usagePercentage: 95,
        documentCount: 48,
        totalFormatted: '100 MB',
        usedFormatted: '95 MB',
        availableFormatted: '5 MB',
      };

      mockApiClient.get.mockResolvedValue({ data: nearlyFullQuota });

      const result = await storageService.getQuota();

      expect(result.usagePercentage).toBe(95);
      expect(result.availableBytes).toBe(5242880);
    });

    it('returns quota when storage is completely full', async () => {
      const fullQuota: StorageQuota = {
        totalBytes: 104857600,
        usedBytes: 104857600,
        availableBytes: 0,
        usagePercentage: 100,
        documentCount: 50,
        totalFormatted: '100 MB',
        usedFormatted: '100 MB',
        availableFormatted: '0 B',
      };

      mockApiClient.get.mockResolvedValue({ data: fullQuota });

      const result = await storageService.getQuota();

      expect(result.usagePercentage).toBe(100);
      expect(result.availableBytes).toBe(0);
    });

    it('throws on unauthorized access', async () => {
      const error = new Error('Unauthorized');
      mockApiClient.get.mockRejectedValue(error);

      await expect(storageService.getQuota()).rejects.toThrow('Unauthorized');
    });

    it('throws on network error', async () => {
      const error = new Error('Network error');
      mockApiClient.get.mockRejectedValue(error);

      await expect(storageService.getQuota()).rejects.toThrow('Network error');
    });

    it('throws on request timeout', async () => {
      const error = new Error('Request timeout');
      mockApiClient.get.mockRejectedValue(error);

      await expect(storageService.getQuota()).rejects.toThrow('Request timeout');
    });

    it('throws on server error', async () => {
      const error = new Error('Internal server error');
      mockApiClient.get.mockRejectedValue(error);

      await expect(storageService.getQuota()).rejects.toThrow('Internal server error');
    });

    it('throws on service unavailable', async () => {
      const error = new Error('Service unavailable');
      mockApiClient.get.mockRejectedValue(error);

      await expect(storageService.getQuota()).rejects.toThrow('Service unavailable');
    });

    it('calls getQuota only once per invocation', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockQuota });

      await storageService.getQuota();

      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
    });

    it('can call getQuota multiple times independently', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockQuota });

      await storageService.getQuota();
      await storageService.getQuota();
      await storageService.getQuota();

      expect(mockApiClient.get).toHaveBeenCalledTimes(3);
      expect(mockApiClient.get).toHaveBeenNthCalledWith(1, '/storage/quota');
      expect(mockApiClient.get).toHaveBeenNthCalledWith(2, '/storage/quota');
      expect(mockApiClient.get).toHaveBeenNthCalledWith(3, '/storage/quota');
    });

    it('returns updated quota on second call after data changes', async () => {
      const initialQuota: StorageQuota = { ...mockQuota, usedBytes: 10000000, usagePercentage: 10 };
      const updatedQuota: StorageQuota = { ...mockQuota, usedBytes: 20000000, usagePercentage: 20 };

      mockApiClient.get
        .mockResolvedValueOnce({ data: initialQuota })
        .mockResolvedValueOnce({ data: updatedQuota });

      const firstResult = await storageService.getQuota();
      const secondResult = await storageService.getQuota();

      expect(firstResult.usedBytes).toBe(10000000);
      expect(secondResult.usedBytes).toBe(20000000);
    });

    it('returns correct availableBytes when usedBytes equals totalBytes', async () => {
      const fullStorageQuota: StorageQuota = {
        totalBytes: 50000000,
        usedBytes: 50000000,
        availableBytes: 0,
        usagePercentage: 100,
        documentCount: 25,
        totalFormatted: '50 MB',
        usedFormatted: '50 MB',
        availableFormatted: '0 B',
      };

      mockApiClient.get.mockResolvedValue({ data: fullStorageQuota });

      const result = await storageService.getQuota();

      expect(result.availableBytes).toBe(0);
      expect(result.totalBytes).toBe(result.usedBytes);
    });
  });
});
