import apiClient from '@/services/api/client';

export type ComparisonTrend = 'up' | 'down' | 'stable';

export interface ComparisonPeriodResponse {
  start: string;
  end: string;
  total: number;
}

export interface ComparisonResponse {
  current: ComparisonPeriodResponse;
  previous: ComparisonPeriodResponse;
  delta: number;
  percentageChange: number;
  trend: ComparisonTrend;
}

export interface ComparisonRequestParams {
  currentStart: Date | string;
  currentEnd: Date | string;
  compareStart: Date | string;
  compareEnd: Date | string;
  categoryId?: string;
}

const client = apiClient.getInstance();

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

export const comparisonApi = {
  async fetch(params: ComparisonRequestParams): Promise<ComparisonResponse> {
    const response = await client.get<ComparisonResponse>('/statistics/comparison', {
      params: {
        currentStart: toIso(params.currentStart),
        currentEnd: toIso(params.currentEnd),
        compareStart: toIso(params.compareStart),
        compareEnd: toIso(params.compareEnd),
        ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      },
    });
    return response.data;
  },
};
