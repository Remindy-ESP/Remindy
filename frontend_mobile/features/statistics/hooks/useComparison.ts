import { useCallback, useEffect, useState } from 'react';
import { comparisonApi, ComparisonResponse } from '../api/comparison.api';
import type { PeriodDateRange } from '@/components/PeriodFilter/usePeriodFilter';

export interface UseComparisonOptions {
  range: PeriodDateRange | null;
  categoryId?: string;
  enabled?: boolean;
}

export interface UseComparisonResult {
  data: ComparisonResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useComparison(options: UseComparisonOptions): UseComparisonResult {
  const { range, categoryId, enabled = true } = options;
  const [data, setData] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const startKey = range?.start.toISOString();
  const endKey = range?.end.toISOString();
  const previousStartKey = range?.previousStart.toISOString();
  const previousEndKey = range?.previousEnd.toISOString();

  const fetchData = useCallback(async () => {
    if (!enabled || !range) {
      setData(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await comparisonApi.fetch({
        currentStart: range.start,
        currentEnd: range.end,
        compareStart: range.previousStart,
        compareEnd: range.previousEnd,
        categoryId,
      });
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, startKey, endKey, previousStartKey, previousEndKey, categoryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
