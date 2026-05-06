import { statisticsService, type ExpenseSummaryResponse } from '../statistics.service';
import apiClient from '../client';

jest.mock('../client');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

const sample: ExpenseSummaryResponse = {
  periodLabel: 'Octobre 2025',
  currentTotal: 203.85,
  previousTotal: 211.2,
  percentageChange: -3.5,
  trend: 'down',
  comparisonLabel: 'Comparo M-1',
};

describe('StatisticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getExpenseSummary', () => {
    it('GETs /statistics/summary with the period as a query param', async () => {
      mockApiClient.get.mockResolvedValue({ data: sample });

      const result = await statisticsService.getExpenseSummary('month');

      expect(mockApiClient.get).toHaveBeenCalledWith('/statistics/summary', {
        params: { period: 'month' },
      });
      expect(result).toEqual(sample);
    });

    it('forwards the day period unchanged', async () => {
      mockApiClient.get.mockResolvedValue({ data: sample });
      await statisticsService.getExpenseSummary('day');
      expect(mockApiClient.get).toHaveBeenCalledWith('/statistics/summary', {
        params: { period: 'day' },
      });
    });

    it('forwards the week period unchanged', async () => {
      mockApiClient.get.mockResolvedValue({ data: sample });
      await statisticsService.getExpenseSummary('week');
      expect(mockApiClient.get).toHaveBeenCalledWith('/statistics/summary', {
        params: { period: 'week' },
      });
    });

    it('forwards the year period unchanged', async () => {
      mockApiClient.get.mockResolvedValue({ data: sample });
      await statisticsService.getExpenseSummary('year');
      expect(mockApiClient.get).toHaveBeenCalledWith('/statistics/summary', {
        params: { period: 'year' },
      });
    });

    it('propagates network errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));
      await expect(statisticsService.getExpenseSummary('month')).rejects.toThrow(
        'Network error',
      );
    });
  });
});
