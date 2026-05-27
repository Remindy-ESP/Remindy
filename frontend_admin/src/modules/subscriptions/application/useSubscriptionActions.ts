import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { subscriptionsApi } from '@/modules/subscriptions/infrastructure/subscriptionsApi';
import type { UpdateSharedSubscriptionRequest } from '@/shared/domain/types';

export function useSubscriptionActions() {
  const qc = useQueryClient();

  const updateShared = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateSharedSubscriptionRequest;
    }) => subscriptionsApi.updateShared(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      toast.success('Abonnement mis à jour');
    },
    onError: () => toast.error('Échec de la mise à jour'),
  });

  return { updateShared };
}
