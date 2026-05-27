import apiClient from '@/shared/infrastructure/apiClient';
import type { Period } from '@/types/statistics';

export type ExpenseTrend = 'up' | 'down' | 'stable';

export interface ExpenseSummaryResponse {
  periodLabel: string;
  currentTotal: number;
  previousTotal: number;
  percentageChange: number;
  trend: ExpenseTrend;
  comparisonLabel: string;
}

class StatisticsService {
  private readonly BASE_PATH = '/statistics';

  async getExpenseSummary(period: Period): Promise<ExpenseSummaryResponse> {
    const response = await apiClient.get<ExpenseSummaryResponse>(
      `${this.BASE_PATH}/summary`,
      { params: { period } },
    );
    return response.data;
  }
}

export const statisticsService = new StatisticsService();
export default statisticsService;
