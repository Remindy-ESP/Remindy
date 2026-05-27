import { useQuery } from '@tanstack/react-query';
import { rgpdApi } from '@/modules/rgpd/infrastructure/rgpdApi';
import { RgpdExportStatus, type RgpdExportQuery } from '@/shared/domain/types';

const REFETCH_WHEN_PROCESSING_MS = 30_000;

export function useRgpdExports(params: RgpdExportQuery) {
  return useQuery({
    queryKey: ['admin-rgpd-exports', params],
    queryFn: () => rgpdApi.listExports(params),
    staleTime: 30_000,
    refetchInterval: query => {
      const data = query.state.data;
      const hasProcessing = data?.items.some(
        e =>
          e.status === RgpdExportStatus.PROCESSING ||
          e.status === RgpdExportStatus.PENDING
      );
      return hasProcessing ? REFETCH_WHEN_PROCESSING_MS : false;
    },
  });
}

export function useRgpdKpi() {
  const pending = useQuery({
    queryKey: ['admin-rgpd-kpi', 'pending'],
    queryFn: () =>
      rgpdApi.listExports({
        status: RgpdExportStatus.PENDING,
        page: 1,
        limit: 1,
      }),
    staleTime: 30_000,
  });

  const ready = useQuery({
    queryKey: ['admin-rgpd-kpi', 'ready'],
    queryFn: () =>
      rgpdApi.listExports({
        status: RgpdExportStatus.COMPLETED,
        page: 1,
        limit: 1,
      }),
    staleTime: 30_000,
  });

  return { pending, ready };
}
