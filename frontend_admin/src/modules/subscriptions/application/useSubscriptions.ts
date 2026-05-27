import { useQuery } from '@tanstack/react-query';
import { subscriptionsApi } from '@/modules/subscriptions/infrastructure/subscriptionsApi';
import type { AdminSubscriptionsQuery } from '@/shared/domain/types';

export function useSubscriptions(params: AdminSubscriptionsQuery) {
  return useQuery({
    queryKey: ['admin-subscriptions', params],
    queryFn: () => subscriptionsApi.list(params),
    staleTime: 30_000,
  });
}
