import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { cloudApi } from '@/modules/cloud/infrastructure/cloudApi';
import type { ReprocessOcrRequest } from '@/shared/domain/types';

export function useDocumentActions() {
  const qc = useQueryClient();

  const reprocessOcr = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReprocessOcrRequest }) =>
      cloudApi.reprocessOcr(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-documents'] });
      toast.success('Retraitement OCR lancé');
    },
    onError: () => toast.error('Échec du retraitement OCR'),
  });

  return { reprocessOcr };
}
