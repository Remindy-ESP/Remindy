import { useQuery } from '@tanstack/react-query';
import { cloudApi } from '@/modules/cloud/infrastructure/cloudApi';
import { OcrStatus, type AdminDocumentQuery } from '@/shared/domain/types';

const REFETCH_WHEN_PROCESSING_MS = 30_000;

export function useAdminDocuments(params: AdminDocumentQuery) {
  return useQuery({
    queryKey: ['admin-documents', params],
    queryFn: () => cloudApi.listDocuments(params),
    staleTime: 30_000,
    refetchInterval: query => {
      const data = query.state.data;
      const hasProcessing = data?.items.some(
        d =>
          d.ocrStatus === OcrStatus.PROCESSING ||
          d.ocrStatus === OcrStatus.PENDING
      );
      return hasProcessing ? REFETCH_WHEN_PROCESSING_MS : false;
    },
  });
}
