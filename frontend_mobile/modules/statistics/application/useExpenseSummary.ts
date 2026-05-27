import { useCallback, useEffect, useState } from 'react';
import {
  statisticsService,
  type ExpenseSummaryResponse,
} from '@/modules/statistics/infrastructure/statisticsApi';
import type { Period } from '@/types/statistics';
import i18n from '@/i18n';

interface UseExpenseSummaryResult {
  data: ExpenseSummaryResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useExpenseSummary(period: Period): UseExpenseSummaryResult {
  const [data, setData] = useState<ExpenseSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await statisticsService.getExpenseSummary(period);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n.t('errors.expenseSummaryLoadFailed'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
